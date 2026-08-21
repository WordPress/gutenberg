export const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';
export const FLOATING_NOTES_SIDEBAR = 'edit-post/collab-sidebar';
export const SIDEBARS = [ ALL_NOTES_SIDEBAR, FLOATING_NOTES_SIDEBAR ];

/**
 * Preference holding the per-post timestamp of the last time the current user
 * looked at a post's notes, as a `{ [ postId ]: date_gmt }` map. It rides on
 * the existing preferences store - and therefore the `persisted_preferences`
 * user meta - rather than introducing a read-tracking API of its own.
 */
export const NOTES_LAST_SEEN_SCOPE = 'core';
export const NOTES_LAST_SEEN_PREFERENCE = 'notesLastSeen';

/**
 * How many posts keep an entry in that map. The map is persisted with every
 * other editor preference, so it is capped to the most recently seen posts
 * instead of growing with every post the user ever opens.
 */
export const NOTES_LAST_SEEN_LIMIT = 100;
