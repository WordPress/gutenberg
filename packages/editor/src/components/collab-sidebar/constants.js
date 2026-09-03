export const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';
export const FLOATING_NOTES_SIDEBAR = 'edit-post/collab-sidebar';
export const SIDEBARS = [ ALL_NOTES_SIDEBAR, FLOATING_NOTES_SIDEBAR ];

/*
 * Style Book notes get their own complementary area rather than reusing
 * `ALL_NOTES_SIDEBAR`: the two never coexist, but they hold different notes
 * about different things, so sharing an identifier would also share the pinned
 * state and leave the Style Book's pin toggling the post editor's sidebar.
 */
export const STYLE_BOOK_NOTES_SIDEBAR = 'editor/style-book-notes';
