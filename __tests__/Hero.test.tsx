import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Hero from '@/components/Hero'

describe('Hero', () => {
  it('primary CTA is keyboard focusable', async () => {
    const user = userEvent.setup()
    const onPrimary = jest.fn()
    render(<Hero onPrimaryCta={onPrimary} />)

    const primary = screen.getByRole('button', {
      name: /explore solutions/i,
    })

    primary.focus()
    expect(primary).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onPrimary).toHaveBeenCalledTimes(1)
  })
})


