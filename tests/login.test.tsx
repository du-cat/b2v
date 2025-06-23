import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../src/pages/Login'
import { ReactElement } from 'react'

const renderWithRouter = (component: ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login Page', () => {
  it('should render login form', () => {
    renderWithRouter(<Login />)
    
    // Check for essential elements
    expect(screen.getByRole('heading', { name: /Sign in to SentinelPOS Guardian/i })).toBeDefined()
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined()
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined()
    expect(screen.getByRole('button', { name: /Signing in/i })).toBeDefined()
  })

  it('should show email input and submit button', async () => {
    renderWithRouter(<Login />)
    
    const emailInput = screen.getByPlaceholderText('you@example.com')
    expect(emailInput).toBeDefined()

    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDefined()
    expect(submitButton).toBeDisabled()
  })
})
