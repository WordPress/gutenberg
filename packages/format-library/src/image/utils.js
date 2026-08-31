/**
 * Updates the active inline image object's width and alt text while preserving
 * any other registered or unregistered attributes on the replacement.
 *
 * @param {Object}                  value       Value with an active image object.
 * @param {Object}                  edits       Width and alt edits.
 * @param {string|number|undefined} edits.width Edited width in pixels.
 * @param {string|undefined}        edits.alt   Edited alt text.
 * @return {Object} Updated rich text value.
 */
export function updateActiveInlineImage( value, { width, alt } ) {
	const current = value.replacements[ value.start ];
	const newReplacements = value.replacements.slice();

	newReplacements[ value.start ] = {
		...current,
		type: 'core/image',
		attributes: {
			...current?.attributes,
			style: width ? `width: ${ width }px;` : '',
			alt,
		},
	};

	return {
		...value,
		replacements: newReplacements,
	};
}
