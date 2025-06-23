import '@testing-library/jest-dom'
import { beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
  // Clear any previous test environment
  cleanup()
})
