export const ALL_NOTES_SIDEBAR = 'edit-post/collab-history-sidebar';

// Width of the floating notes panel; the same amount of space is reserved
// inside the canvas so content never flows under the panel.
export const NOTES_PANEL_WIDTH = 280;

// Space reserved in the canvas when notes are minimized. Threads collapse to
// an avatar pill (~50px) anchored to the inline-end edge with a `$grid-unit-20`
// (16px) margin; reserving pill + a matching margin on each side keeps the pill
// from overlapping full-width content and centers it in the reserved gap.
export const NOTES_PANEL_COMPACT_WIDTH = 82;

// The editor canvas is freely resizable (Settings sidebar, window size,
// zoomed-out view), so a wide viewport can still hold a narrow canvas. The
// floating notes yield progressively as the canvas narrows: full threads
// collapse to minimized avatar pills first, and the pills disappear entirely
// when even they would crowd the content column. The thresholds keep a
// readable content column (~600px, the theme content width ballpark) next to
// the full panel, and a usable one (~400px) next to the pills.
export const MIN_CANVAS_WIDTH_FOR_FULL_NOTES = NOTES_PANEL_WIDTH + 600;
export const MIN_CANVAS_WIDTH_FOR_FLOATING_NOTES =
	NOTES_PANEL_COMPACT_WIDTH + 400;
