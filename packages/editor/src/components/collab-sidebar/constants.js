export const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';

// `{ [ postId ]: date_gmt }` map of when the user last saw each post's notes.
export const NOTES_LAST_SEEN_SCOPE = 'core';
export const NOTES_LAST_SEEN_PREFERENCE = 'notesLastSeen';

// Most recently seen posts kept in that map, so the persisted preference stays small.
export const NOTES_LAST_SEEN_LIMIT = 100;

export const NOTE_FORMAT_NAME = 'core/note';
