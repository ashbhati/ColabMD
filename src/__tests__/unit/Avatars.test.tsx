import { render, screen } from '@testing-library/react'
import { Avatars } from '@/components/Presence/Avatars'

type MockUser = {
  id: string
  connectionId: number
  info: {
    name: string
    avatar: string
    color: string
  }
}

const mockUseOthers = jest.fn<MockUser[], []>(() => [])
const mockUseSelf = jest.fn(() => null)

jest.mock('../../../liveblocks.config', () => ({
  useOthers: () => mockUseOthers(),
  useSelf: () => mockUseSelf(),
}))

describe('Avatars', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates the current user from others list', () => {
    mockUseSelf.mockReturnValue({
      id: 'self-user',
      info: { name: 'Ashish', avatar: '', color: '#111111' },
    })
    mockUseOthers.mockReturnValue([
      {
        id: 'self-user',
        connectionId: 1,
        info: { name: 'Ashish', avatar: '', color: '#111111' },
      },
      {
        id: 'other-user',
        connectionId: 2,
        info: { name: 'Priya', avatar: '', color: '#222222' },
      },
    ])

    render(<Avatars />)

    // Only one "A" badge should render (self avatar), plus one "P" badge from others.
    expect(screen.getByTitle('Priya')).toBeInTheDocument()
    expect(screen.getByTitle('Ashish (you)')).toBeInTheDocument()
    expect(screen.queryByTitle('Ashish')).not.toBeInTheDocument()
  })

  it('shows overflow badge when more than three collaborators are present', () => {
    mockUseSelf.mockReturnValue(null)
    mockUseOthers.mockReturnValue([
      { id: 'u1', connectionId: 1, info: { name: 'A', avatar: '', color: '#111' } },
      { id: 'u2', connectionId: 2, info: { name: 'B', avatar: '', color: '#222' } },
      { id: 'u3', connectionId: 3, info: { name: 'C', avatar: '', color: '#333' } },
      { id: 'u4', connectionId: 4, info: { name: 'D', avatar: '', color: '#444' } },
    ])

    render(<Avatars />)

    expect(screen.getByText('+1')).toBeInTheDocument()
  })
})
