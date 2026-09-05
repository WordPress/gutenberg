export const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';

// Width of the floating notes panel; the same amount of space is reserved
// inside the canvas so content never flows under the panel.
export const NOTES_PANEL_WIDTH = 280;

// Minimum canvas width before the floating panel yields. The editor canvas is
// now freely resizable, so a wide viewport can still hold a narrow canvas.
// Below this width the reserved space would crowd out the content column, so
// the floating panel hides and the "All notes" sidebar remains the surface.
// Twice the panel width keeps at least an equal share for the content.
export const MIN_CANVAS_WIDTH_FOR_FLOATING_NOTES = NOTES_PANEL_WIDTH * 2;
