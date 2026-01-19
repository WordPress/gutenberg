/**
 * Sanitize the raw string and make sure it's an SVG.
 *
 * @param {string} rawString The media object for the selected SVG file.
 * @return { string }        The sanitized svg string.
 */
export function sanitizeRawSVGString( rawString ) {
	const svgDoc = new window.DOMParser().parseFromString(
		rawString,
		'image/svg+xml'
	);
	let svgString = '';

	// TODO: Very basic SVG sanitization, likely needs more refinement.
	if (
		svgDoc.childNodes.length === 1 &&
		svgDoc.firstChild.nodeName === 'svg'
	) {
		svgString = new window.XMLSerializer().serializeToString(
			svgDoc.documentElement
		);
	}

	return svgString;
}
