import { createClient } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Presence - data that will be sent to other users when they enter the room
export type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
};

// Storage - the data that is synchronized and persisted in the room
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Storage = {
  // Using Yjs for document content synchronization - actual content is managed by Liveblocks
};

// UserMeta - static metadata about users
export type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar: string;
    color: string;
  };
};

// RoomEvent - custom events that can be broadcast to all users in the room
export type RoomEvent = {
  type: "SAVE_DOCUMENT";
};

// ThreadMetadata - metadata attached to comment threads
export type ThreadMetadata = {
  resolved: boolean;
  highlightId: string;
};

const roomContext = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client);
const liveblocksContext = createLiveblocksContext(client);

// Export only what we need from room context
export const RoomProvider = roomContext.suspense.RoomProvider;
export const useRoom = roomContext.suspense.useRoom;
export const useMyPresence = roomContext.suspense.useMyPresence;
export const useUpdateMyPresence = roomContext.suspense.useUpdateMyPresence;
export const useSelf = roomContext.suspense.useSelf;
export const useOthers = roomContext.suspense.useOthers;
export const useOthersMapped = roomContext.suspense.useOthersMapped;
export const useOthersConnectionIds = roomContext.suspense.useOthersConnectionIds;
export const useOther = roomContext.suspense.useOther;
export const useBroadcastEvent = roomContext.suspense.useBroadcastEvent;
export const useEventListener = roomContext.suspense.useEventListener;
export const useErrorListener = roomContext.suspense.useErrorListener;
export const useStorage = roomContext.suspense.useStorage;
export const useHistory = roomContext.suspense.useHistory;
export const useUndo = roomContext.suspense.useUndo;
export const useRedo = roomContext.suspense.useRedo;
export const useCanUndo = roomContext.suspense.useCanUndo;
export const useCanRedo = roomContext.suspense.useCanRedo;
export const useMutation = roomContext.suspense.useMutation;
export const useStatus = roomContext.suspense.useStatus;
export const useLostConnectionListener = roomContext.suspense.useLostConnectionListener;
export const useThreads = roomContext.suspense.useThreads;
export const useCreateThread = roomContext.suspense.useCreateThread;
export const useEditThreadMetadata = roomContext.suspense.useEditThreadMetadata;
export const useCreateComment = roomContext.suspense.useCreateComment;
export const useEditComment = roomContext.suspense.useEditComment;
export const useDeleteComment = roomContext.suspense.useDeleteComment;
export const useAddReaction = roomContext.suspense.useAddReaction;
export const useRemoveReaction = roomContext.suspense.useRemoveReaction;
export const useMarkThreadAsResolved = roomContext.suspense.useMarkThreadAsResolved;
export const useMarkThreadAsUnresolved = roomContext.suspense.useMarkThreadAsUnresolved;

// Export from liveblocks context
export const LiveblocksProvider = liveblocksContext.suspense.LiveblocksProvider;
export const useInboxNotifications = liveblocksContext.suspense.useInboxNotifications;
export const useUser = liveblocksContext.suspense.useUser;
export const useRoomInfo = liveblocksContext.suspense.useRoomInfo;
