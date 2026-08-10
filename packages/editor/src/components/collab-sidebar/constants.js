export const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';
export const FLOATING_NOTES_SIDEBAR = 'edit-post/collab-sidebar';
export const SIDEBARS = [ ALL_NOTES_SIDEBAR, FLOATING_NOTES_SIDEBAR ];

/*
 * The distributed-editing sequestration wrapper (see
 * lib/experimental/distributed-editing/). Unapproved protected markup is
 * carried inert in this void block's attributes; the sidebar surfaces each
 * wrapper as a review thread with Approve / Reject actions.
 */
export const PENDING_REVIEW_BLOCK_NAME = 'de/pending-review';

// Thread `type` distinguishing synthetic review threads from note threads.
export const REVIEW_THREAD_TYPE = 'pending-review';
