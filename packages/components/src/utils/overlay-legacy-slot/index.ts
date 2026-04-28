/**
 * Class name applied to the overlay legacy slot element.
 */
export const OVERLAY_LEGACY_SLOT_CLASSNAME = 'wp-overlay-legacy';

/**
 * Resolves the top-level document so that overlays portaling from inside an
 * iframe still land in the parent document's slot. Falls back to the current
 * document if `window.top` is inaccessible (cross-origin restrictions).
 */
function getTopLevelDocument(): Document {
	try {
		return window.top?.document ?? window.document;
	} catch {
		// Cross-origin access to `window.top.document` throws — use the
		// current frame's document as a safe fallback.
		return window.document;
	}
}

let cachedSlot: HTMLDivElement | null = null;

/**
 * Lazily creates and returns the overlay legacy slot — a body-level container
 * used as the portal target for legacy `@wordpress/components` overlays
 * (Modal, Popover, Tooltip, Snackbar, Draggable clone).
 *
 * The slot has `z-index: 99997` and `isolation: isolate`, establishing a
 * stacking context that sits below the WP admin bar (99,999) and below the
 * overlay prime slot used by `@wordpress/ui` leaf overlays (99,998). Per-
 * overlay z-indexes inside the slot continue to control relative ordering
 * (Tooltip > Popover > Modal), but those values now stack relative to the
 * slot rather than the document body.
 *
 * The slot is created in the top-level document (not the iframe's own
 * document) so that overlays portaling from inside an iframe land in the
 * parent document's slot. The element is cached and reused across calls; if
 * the cached element has been detached or belongs to a different document,
 * a fresh element is created.
 *
 * @return The overlay legacy slot element.
 */
export function getOverlayLegacySlot(): HTMLDivElement {
	const doc = getTopLevelDocument();

	if (
		cachedSlot &&
		cachedSlot.isConnected &&
		cachedSlot.ownerDocument === doc
	) {
		return cachedSlot;
	}

	const existing = doc.body.querySelector< HTMLDivElement >(
		`.${ OVERLAY_LEGACY_SLOT_CLASSNAME }`
	);
	if ( existing ) {
		cachedSlot = existing;
		return existing;
	}

	const slot = doc.createElement( 'div' );
	slot.className = OVERLAY_LEGACY_SLOT_CLASSNAME;
	doc.body.append( slot );
	cachedSlot = slot;
	return slot;
}
