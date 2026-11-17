import { createContext } from '@wordpress/element';

/**
 * Whether blocks are rendered in the preview of a Navigation overlay template
 * part. Navigation blocks there are inside an overlay, but
 * `isWithinNavigationOverlay()` cannot tell, since it reads the post being
 * edited rather than the previewed template part.
 */
const OverlayPreviewContext = createContext( false );

export default OverlayPreviewContext;
