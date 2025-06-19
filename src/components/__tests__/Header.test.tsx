import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../Header'; // Adjust path as necessary

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Auth0 useAuth0 hook
const mockLogout = jest.fn(() => Promise.resolve());
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(() => ({
    isAuthenticated: true,
    user: {
      email: 'test@example.com',
      name: 'Test User',
      picture: 'http://example.com/avatar.png'
    },
    logout: mockLogout,
  })),
}));

// Mock Logo component
jest.mock('../Logo', () => {
  return function DummyLogo() {
    return <div data-testid="logo">Logo</div>;
  };
});

describe('Header Component', () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockPush.mockClear();
    mockLogout.mockClear();
  });

  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'http://example.com/avatar.png'
  };

  it('renders logo and title', () => {
    render(<Header user={null} />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('Grammarly Clone')).toBeInTheDocument();
  });

  it('renders Login button when no user is provided', async () => {
    render(<Header user={null} />);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders user information and dropdown when user is provided', () => {
    render(<Header user={mockUser} />);
    expect(screen.getByText(`Welcome, ${mockUser.email!.split('@')[0]}`)).toBeInTheDocument();

    // Avatar image src check is unreliable in JSDOM, fallback is already checked by other tests.
    // We will check if the fallback (initial letter) is present, which indicates Avatar is there.
    expect(screen.getByText(mockUser.email![0].toUpperCase())).toBeInTheDocument();

    // Check for Fallback (this part seems redundant if the above already checks fallback for mockUser)
    // const mockUserWithoutAvatar = { ...mockUser, user_metadata: {} };
    // render(<Header user={mockUserWithoutAvatar} />);
    // expect(screen.getByText(mockUser.email![0].toUpperCase())).toBeInTheDocument();
  });

  it('dropdown menu appears on avatar click and contains expected items', async () => {
    render(<Header user={mockUser} />);
    // The Avatar component (acting as DropdownMenuTrigger) displays the fallback text.
    // The text 'T' is inside a span, which is inside the trigger span.
    const fallbackTextElement = screen.getByText(mockUser.email![0].toUpperCase());
    const avatarTrigger = fallbackTextElement.parentElement!; // This should be the trigger span

    expect(avatarTrigger).toHaveAttribute('data-state', 'closed'); // Verify initial state
    await userEvent.click(avatarTrigger);
    // screen.debug(document.body, 100000); // For checking portal content
    expect(avatarTrigger).toHaveAttribute('data-state', 'open'); // Verify state after click

    expect(await screen.findByText('My Account')).toBeInTheDocument();
    expect(await screen.findByText('Profile')).toBeInTheDocument();
    expect(await screen.findByText('Settings')).toBeInTheDocument();
    expect(await screen.findByText('Sign Out')).toBeInTheDocument();
  });

  it('calls logout and redirects on "Sign Out" click', async () => {
    render(<Header user={mockUser} />);
    const fallbackTextElement = screen.getByText(mockUser.email![0].toUpperCase());
    const avatarTrigger = fallbackTextElement.parentElement!; // This should be the trigger span

    // Ensure dropdown is open first
    await userEvent.click(avatarTrigger);
    expect(avatarTrigger).toHaveAttribute('data-state', 'open');


    const signOutButton = await screen.findByText('Sign Out');
    await userEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    // Wait for promises to resolve (e.g., async signOut and router.push)
    // We can check for the router push, as the sign out button might disappear after click.
    await expect(mockPush).toHaveBeenCalledWith('/login');
  });

   it('renders fallback avatar when user has no avatar_url', () => {
    const userWithoutAvatar : User = {
        ...mockUser,
        user_metadata: { }, // No avatar_url
    };
    render(<Header user={userWithoutAvatar} />);
    const fallback = screen.getByText(userWithoutAvatar.email![0].toUpperCase());
    expect(fallback).toBeInTheDocument();
  });

  it('renders fallback avatar with U when user has no email and no avatar_url', () => {
    const userWithoutEmailOrAvatar : User = {
        id: 'user-id-456',
        app_metadata: {},
        user_metadata: { },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
    };
    render(<Header user={userWithoutEmailOrAvatar} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });
});
