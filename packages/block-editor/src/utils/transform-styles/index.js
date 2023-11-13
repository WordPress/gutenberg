/**
 * External dependencies
 */
import postcss, { CssSyntaxError } from 'postcss';
import wrap from 'postcss-prefixwrap';
import rebaseUrl from 'postcss-urlrebase';

/**
 * Applies a series of CSS rule transforms to wrap selectors inside a given class and/or rewrite URLs depending on the parameters passed.
 *
 * @typedef {Object} EditorStyle
 * @property {string}        css              the CSS block(s), as a single string.
 * @property {?string}       baseURL          the base URL to be used as the reference when rewritting urls.
 * @property {?string[]}     ignoredSelectors the selectors not to wrap.
 *
 * @param    {EditorStyle[]} styles           CSS rules.
 * @param    {string}        wrapperSelector  Wrapper selector.
 * @return {Array} converted rules.
 */
const transformStyles = ( styles, wrapperSelector = '' ) => {
	return styles.map( ( { css, ignoredSelectors = [], baseURL } ) => {
		try {
			return postcss(
				[
					wrapperSelector &&
						wrap( wrapperSelector, {
							ignoredSelectors: [
								...ignoredSelectors,
								wrapperSelector,
							],
						} ),
					baseURL && rebaseUrl( { rootUrl: baseURL } ),
				].filter( Boolean )
			).process( css, {} ).css; // use sync PostCSS API
		} catch ( error ) {
			if ( ! ( error instanceof CssSyntaxError ) ) {
				// eslint-disable-next-line no-console
				console.warn(
					'wp.blockEditor.transformStyles Failed to transform CSS.',
					error
				);
			}

			return null;
		}
	} );
};

export default transformStyles;
