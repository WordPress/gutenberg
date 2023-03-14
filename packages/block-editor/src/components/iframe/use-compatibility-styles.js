/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Returns a list of stylesheets that target the editor canvas. A stylesheet is
 * considered targetting the editor a canvas if it contains the
 * `editor-styles-wrapper`, `wp-block`, or `wp-block-*` class selectors.
 *
 * Ideally, this hook should be removed in the future and styles should be added
 * explicitly as editor styles.
 */
export function useCompatibilityStyles() {
	// Only memoize the result once on load, since these stylesheets should not
	// change.
	return useMemo( () => {
		// Search the document for stylesheets targetting the editor canvas.
		return Array.from( document.styleSheets ).reduce(
			( accumulator, styleSheet ) => {
				try {
					// May fail for external styles.
					// eslint-disable-next-line no-unused-expressions
					styleSheet.cssRules;
				} catch ( e ) {
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

				// Generally, ignore inline styles. We add inline styles belonging to a
				// stylesheet later, which may or may not match the selectors.
				if ( ownerNode.tagName !== 'LINK' ) {
					return accumulator;
				}

				// Don't try to add the reset styles, which were removed as a dependency
				// from `edit-blocks` for the iframe since we don't need to reset admin
				// styles.
				if ( ownerNode.id === 'wp-reset-editor-styles-css' ) {
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
									selectorText.includes( '.wp-block' ) )
							);
						}
					);
				}

				if ( matchFromRules( cssRules ) ) {
					// Display warning once we have a way to add style dependencies to the editor.
					// See: https://github.com/WordPress/gutenberg/pull/37466.
					accumulator.push( ownerNode.cloneNode( true ) );

					// Add inline styles belonging to the stylesheet.
					const inlineCssId = ownerNode.id.replace(
						'-css',
						'-inline-css'
					);
					const inlineCssElement =
						document.getElementById( inlineCssId );

					if ( inlineCssElement ) {
						accumulator.push( inlineCssElement.cloneNode( true ) );
					}
				}

				return accumulator;
			},
			[]
		);
	}, [] );
}
