/**
 * A component specifically designed to be used as an element referenced
 * by ARIA attributes such as `aria-labelledby` or `aria-describedby`.
 *
 * Keying on the text is what makes this component more than a plain `div`:
 * it makes React replace the element rather than update the existing text
 * node in place. Firefox fails to recompute the accessible description when
 * only the text node of a hidden element changes, so screen readers announce
 * a stale value.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51035
 *
 * @param {Object} props          Props.
 * @param {string} props.children Text to reference. Must be a string, since
 *                                it is used as the key.
 */
export default function AriaReferencedText( { children, ...props } ) {
	return (
		<div hidden { ...props } key={ children }>
			{ children }
		</div>
	);
}
