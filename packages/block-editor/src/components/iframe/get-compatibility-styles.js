let compatibilityStyles = null;

/**
 * WP core handles that don't start with 'wp-' but must still be excluded.
 * Stored as normalised handles (DOM id suffix '-css'/'-inline-css' stripped).
 */
const CORE_STYLE_HANDLES = new Set( [
	'global-styles',
	'global-styles-css-custom-properties',
	'block-style-variation-styles',
] );

/**
 * Normalizes a handle by removing the '-css' or '-inline-css' suffix.
 *
 * @param {string} id The handle to normalize.
 * @return {string} The normalized handle.
 */
function normalizeHandle( id ) {
	return id.replace( /-inline-css$/, '' ).replace( /-css$/, '' );
}

/**
 * Returns a list of stylesheets that target the editor canvas. A stylesheet is
 * considered targeting the editor canvas if it contains the
 * `editor-styles-wrapper`, `wp-block`, or `wp-block-*` class selectors.
 *
 * Ideally, this hook should be removed in the future and styles should be added
 * explicitly as editor styles.
 */
export function getCompatibilityStyles() {
	if ( compatibilityStyles ) {
		return compatibilityStyles;
	}

	// Only memoize the result once on load, since these stylesheets should not
	// change.
	compatibilityStyles = Array.from( document.styleSheets ).reduce(
		( accumulator, styleSheet ) => {
			try {
				// May fail for external styles.
				// eslint-disable-next-line no-unused-expressions
				styleSheet.cssRules;
			} catch {
				return accumulator;
			}

			const { ownerNode, cssRules } = styleSheet;

			// Stylesheet is added by another stylesheet. See
			// https://developer.mozilla.org/en-US/docs/Web/API/StyleSheet/ownerNode#notes.
			if ( ownerNode === null ) {
				return accumulator;
			}

			if ( ! cssRules ) {
				return accumulator;
			}

			// Don't try to add styles without ID. Styles enqueued via the WP dependency system will always have IDs.
			if ( ! ownerNode.id ) {
				return accumulator;
			}

			// Don't try to add core WP styles. We are responsible for adding
			// them. This compatibility layer is only meant to add styles added
			// by plugins or themes.
			if ( ownerNode.id.startsWith( 'wp-' ) ) {
				return accumulator;
			}

			// Don't try to add styles that are dependencies of core WP styles. These are not meant to be added directly.
			if ( CORE_STYLE_HANDLES.has( normalizeHandle( ownerNode.id ) ) ) {
				return accumulator;
			}

			function matchFromRules( _cssRules ) {
				return Array.from( _cssRules ).find(
					( {
						selectorText,
						conditionText,
						cssRules: __cssRules,
					} ) => {
						// If the rule is conditional then it will not have selector text.
						// Recurse into child CSS ruleset to determine selector eligibility.
						if ( conditionText ) {
							return matchFromRules( __cssRules );
						}

						return (
							selectorText &&
							( selectorText.includes(
								'.editor-styles-wrapper'
							) ||
								// Excludes .wp-blocks and .wp-block-editor-* (admin shell).
								/\.wp-block(?!s|-editor)/.test( selectorText ) )
						);
					}
				);
			}

			if ( matchFromRules( cssRules ) ) {
				const isInline = ownerNode.tagName === 'STYLE';

				if ( isInline ) {
					// If the current target is inline,
					// it could be a dependency of an existing stylesheet.
					// Look for that dependency and add it BEFORE the current target.
					const mainStylesCssId = ownerNode.id.replace(
						'-inline-css',
						'-css'
					);
					const mainStylesElement =
						document.getElementById( mainStylesCssId );
					if ( mainStylesElement ) {
						accumulator.push( mainStylesElement.cloneNode( true ) );
					}
				}

				accumulator.push( ownerNode.cloneNode( true ) );

				if ( ! isInline ) {
					// If the current target is not inline,
					// we still look for inline styles that could be relevant for the current target.
					// If they exist, add them AFTER the current target.
					const inlineStylesCssId = ownerNode.id.replace(
						'-css',
						'-inline-css'
					);
					const inlineStylesElement =
						document.getElementById( inlineStylesCssId );
					if ( inlineStylesElement ) {
						accumulator.push(
							inlineStylesElement.cloneNode( true )
						);
					}
				}
			}

			return accumulator;
		},
		[]
	);

	return compatibilityStyles;
}
