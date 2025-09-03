// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StandaloneBookingEscrow
 * @dev Standalone booking escrow contract
 */
contract StandaloneBookingEscrow {
    struct Booking {
        uint256 bookingId;
        address traveler;
        address vendor;
        uint256 checkInTime;
        uint256 checkOutTime;
        string roomDetailsHash;
        uint256 bufferTime;
        uint256 totalAmount;
        BookingStatus status;
        bool exists;
    }

    enum BookingStatus {
        Pending,
        Confirmed,
        CheckedIn,
        Completed,
        Cancelled,
        Disputed
    }

    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public travelerBookings;
    mapping(address => uint256[]) public vendorBookings;
    
    uint256 public nextBookingId = 1;
    address public admin;
    
    uint256 public totalBookings = 0;
    uint256 public totalEscrowAmount = 0;

    event BookingCreated(
        uint256 indexed bookingId,
        address indexed traveler,
        address indexed vendor,
        uint256 amount
    );
    event BookingConfirmed(uint256 indexed bookingId);
    event BookingCancelled(uint256 indexed bookingId, uint256 refundAmount);
    event PaymentReleased(uint256 indexed bookingId, uint256 amount);
    event BookingDisputed(uint256 indexed bookingId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyValidBooking(uint256 _bookingId) {
        require(bookings[_bookingId].exists, "Booking does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createBooking(
        address _vendor,
        uint256 _checkInTime,
        uint256 _checkOutTime,
        string memory _roomDetailsHash,
        uint256 _bufferTime
    ) external payable {
        require(msg.value > 0, "Payment required");
        require(_checkInTime > block.timestamp, "Check-in must be in the future");
        require(_checkOutTime > _checkInTime, "Check-out must be after check-in");
        require(_vendor != address(0), "Invalid vendor address");

        bookings[nextBookingId] = Booking({
            bookingId: nextBookingId,
            traveler: msg.sender,
            vendor: _vendor,
            checkInTime: _checkInTime,
            checkOutTime: _checkOutTime,
            roomDetailsHash: _roomDetailsHash,
            bufferTime: _bufferTime,
            totalAmount: msg.value,
            status: BookingStatus.Pending,
            exists: true
        });

        travelerBookings[msg.sender].push(nextBookingId);
        vendorBookings[_vendor].push(nextBookingId);
        
        totalBookings++;
        totalEscrowAmount += msg.value;

        emit BookingCreated(nextBookingId, msg.sender, _vendor, msg.value);
        nextBookingId++;
    }

    function confirmBooking(uint256 _bookingId) external onlyValidBooking(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.traveler, "Only traveler can confirm");
        require(booking.status == BookingStatus.Pending, "Invalid booking status");
        require(block.timestamp >= booking.checkInTime, "Cannot confirm before check-in time");

        booking.status = BookingStatus.Confirmed;
        emit BookingConfirmed(_bookingId);
    }

    function checkIn(uint256 _bookingId) external onlyValidBooking(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.traveler, "Only traveler can check in");
        require(booking.status == BookingStatus.Confirmed, "Booking must be confirmed first");
        require(block.timestamp >= booking.checkInTime, "Cannot check in before check-in time");

        booking.status = BookingStatus.CheckedIn;
    }

    function releasePayment(uint256 _bookingId) external onlyValidBooking(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(
            booking.status == BookingStatus.CheckedIn || 
            (booking.status == BookingStatus.Confirmed && 
             block.timestamp >= booking.checkInTime + booking.bufferTime),
            "Payment cannot be released yet"
        );

        booking.status = BookingStatus.Completed;
        totalEscrowAmount -= booking.totalAmount;
        
        // Transfer payment to vendor
        (bool success, ) = booking.vendor.call{value: booking.totalAmount}("");
        require(success, "Payment transfer failed");

        emit PaymentReleased(_bookingId, booking.totalAmount);
    }

    function cancelBooking(uint256 _bookingId) external onlyValidBooking(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.traveler, "Only traveler can cancel");
        require(booking.status == BookingStatus.Pending, "Cannot cancel confirmed booking");
        require(block.timestamp < booking.checkInTime, "Cannot cancel after check-in time");

        booking.status = BookingStatus.Cancelled;
        totalEscrowAmount -= booking.totalAmount;
        
        // Refund to traveler
        (bool success, ) = booking.traveler.call{value: booking.totalAmount}("");
        require(success, "Refund transfer failed");

        emit BookingCancelled(_bookingId, booking.totalAmount);
    }

    function raiseDispute(uint256 _bookingId) external onlyValidBooking(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.traveler || msg.sender == booking.vendor,
            "Only traveler or vendor can raise dispute"
        );
        require(
            booking.status == BookingStatus.Confirmed || 
            booking.status == BookingStatus.CheckedIn,
            "Invalid booking status for dispute"
        );

        booking.status = BookingStatus.Disputed;
        emit BookingDisputed(_bookingId);
    }

    function resolveDispute(
        uint256 _bookingId,
        address _winner,
        uint256 _travelerAmount,
        uint256 _vendorAmount
    ) external onlyAdmin onlyValidBooking(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(booking.status == BookingStatus.Disputed, "Booking not in dispute");
        require(_travelerAmount + _vendorAmount == booking.totalAmount, "Amounts must equal total");

        booking.status = BookingStatus.Completed;
        totalEscrowAmount -= booking.totalAmount;

        // Transfer amounts
        if (_travelerAmount > 0) {
            (bool success1, ) = booking.traveler.call{value: _travelerAmount}("");
            require(success1, "Traveler payment failed");
        }
        
        if (_vendorAmount > 0) {
            (bool success2, ) = booking.vendor.call{value: _vendorAmount}("");
            require(success2, "Vendor payment failed");
        }

        emit PaymentReleased(_bookingId, booking.totalAmount);
    }

    function getBooking(uint256 _bookingId) external view returns (Booking memory) {
        require(bookings[_bookingId].exists, "Booking does not exist");
        return bookings[_bookingId];
    }

    function getTravelerBookings(address _traveler) external view returns (uint256[] memory) {
        return travelerBookings[_traveler];
    }

    function getVendorBookings(address _vendor) external view returns (uint256[] memory) {
        return vendorBookings[_vendor];
    }

    function getTotalBookings() external view returns (uint256) {
        return totalBookings;
    }

    function getTotalEscrowAmount() external view returns (uint256) {
        return totalEscrowAmount;
    }
}
