/**
 * Liveblocks Mock Utilities
 *
 * Provides mocks for Liveblocks real-time collaboration features
 * including presence, rooms, and user information.
 */

import { ReactNode } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MockPresence {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
}

export interface MockUserInfo {
  name: string;
  email: string;
  avatar: string;
  color: string;
}

export interface MockOtherUser {
  connectionId: number;
  presence: MockPresence;
  info: MockUserInfo;
}

export interface MockSelf {
  connectionId: number;
  presence: MockPresence;
  info: MockUserInfo;
}

export interface MockThread {
  id: string;
  roomId: string;
  createdAt: Date;
  metadata: {
    resolved: boolean;
    highlightId: string;
  };
  comments: MockComment[];
}

export interface MockComment {
  id: string;
  threadId: string;
  userId: string;
  body: string;
  createdAt: Date;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

export function createMockPresence(overrides: Partial<MockPresence> = {}): MockPresence {
  return {
    cursor: null,
    name: 'Test User',
    color: '#6366f1',
    ...overrides,
  };
}

export function createMockUserInfo(overrides: Partial<MockUserInfo> = {}): MockUserInfo {
  return {
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    color: '#6366f1',
    ...overrides,
  };
}

export function createMockOtherUser(overrides: Partial<MockOtherUser> = {}): MockOtherUser {
  return {
    connectionId: Math.floor(Math.random() * 10000),
    presence: createMockPresence(),
    info: createMockUserInfo(),
    ...overrides,
  };
}

export function createMockSelf(overrides: Partial<MockSelf> = {}): MockSelf {
  return {
    connectionId: 1,
    presence: createMockPresence({ name: 'You' }),
    info: createMockUserInfo({ name: 'You' }),
    ...overrides,
  };
}

export function createMockThread(overrides: Partial<MockThread> = {}): MockThread {
  const threadId = `thread-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id: threadId,
    roomId: 'doc:test-doc-123',
    createdAt: new Date(),
    metadata: {
      resolved: false,
      highlightId: `highlight-${Math.random().toString(36).substr(2, 9)}`,
    },
    comments: [],
    ...overrides,
  };
}

export function createMockComment(threadId: string, overrides: Partial<MockComment> = {}): MockComment {
  return {
    id: `comment-${Math.random().toString(36).substr(2, 9)}`,
    threadId,
    userId: 'user-123',
    body: 'This is a test comment',
    createdAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Hook Mocks
// ============================================================================

export const mockUseOthers = jest.fn().mockReturnValue([]);
export const mockUseSelf = jest.fn().mockReturnValue(null);
export const mockUseMyPresence = jest.fn().mockReturnValue([createMockPresence(), jest.fn()]);
export const mockUseUpdateMyPresence = jest.fn().mockReturnValue(jest.fn());
export const mockUseRoom = jest.fn().mockReturnValue({
  id: 'doc:test-doc-123',
  getPresence: jest.fn().mockReturnValue(createMockPresence()),
});
export const mockUseBroadcastEvent = jest.fn().mockReturnValue(jest.fn());
export const mockUseEventListener = jest.fn();
export const mockUseThreads = jest.fn().mockReturnValue({ threads: [] });
export const mockUseCreateThread = jest.fn().mockReturnValue(jest.fn());
export const mockUseCreateComment = jest.fn().mockReturnValue(jest.fn());
export const mockUseStatus = jest.fn().mockReturnValue('connected');

// ============================================================================
// Component Mocks
// ============================================================================

export const MockRoomProvider = jest.fn(({ children }: { children: ReactNode }) => children);
export const MockLiveblocksProvider = jest.fn(({ children }: { children: ReactNode }) => children);
export const MockClientSideSuspense = jest.fn(
  ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => children || fallback
);

// ============================================================================
// Module Mock
// ============================================================================

export function mockLiveblocksConfig() {
  jest.mock('liveblocks.config', () => ({
    RoomProvider: MockRoomProvider,
    LiveblocksProvider: MockLiveblocksProvider,
    useOthers: mockUseOthers,
    useSelf: mockUseSelf,
    useMyPresence: mockUseMyPresence,
    useUpdateMyPresence: mockUseUpdateMyPresence,
    useRoom: mockUseRoom,
    useBroadcastEvent: mockUseBroadcastEvent,
    useEventListener: mockUseEventListener,
    useThreads: mockUseThreads,
    useCreateThread: mockUseCreateThread,
    useCreateComment: mockUseCreateComment,
    useStatus: mockUseStatus,
  }));
}

export function mockLiveblocksReact() {
  jest.mock('@liveblocks/react', () => ({
    ClientSideSuspense: MockClientSideSuspense,
  }));
}

export function mockLiveblocksReactTiptap() {
  jest.mock('@liveblocks/react-tiptap', () => ({
    useLiveblocksExtension: jest.fn().mockReturnValue({}),
    FloatingComposer: jest.fn(() => null),
    FloatingThreads: jest.fn(() => null),
  }));
}

// ============================================================================
// Test Utilities
// ============================================================================

export function setupCollaborationScenario(otherUsersCount: number): {
  self: MockSelf;
  others: MockOtherUser[];
  threads: MockThread[];
} {
  const self = createMockSelf();
  const others = Array.from({ length: otherUsersCount }, (_, i) =>
    createMockOtherUser({
      connectionId: i + 2,
      info: createMockUserInfo({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      }),
    })
  );
  const threads: MockThread[] = [];

  mockUseSelf.mockReturnValue(self);
  mockUseOthers.mockReturnValue(others);
  mockUseThreads.mockReturnValue({ threads });

  return { self, others, threads };
}

export function simulateCursorMove(
  user: MockOtherUser | MockSelf,
  position: { x: number; y: number }
): void {
  user.presence.cursor = position;
}

export function simulateUserJoin(): MockOtherUser {
  const newUser = createMockOtherUser();
  const currentOthers = mockUseOthers();
  mockUseOthers.mockReturnValue([...currentOthers, newUser]);
  return newUser;
}

export function simulateUserLeave(connectionId: number): void {
  const currentOthers = mockUseOthers();
  mockUseOthers.mockReturnValue(
    currentOthers.filter((u: MockOtherUser) => u.connectionId !== connectionId)
  );
}
