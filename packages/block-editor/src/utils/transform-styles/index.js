/**
 * External dependencies
 */
import postcss, { CssSyntaxError } from 'postcss';
import prefixSelector from 'postcss-prefix-selector';
import rebaseUrl from 'postcss-urlrebase';

const cacheByWrapperSelector = new Map();

const ROOT_SELECTORS = [
	':root :where(body)',
	':where(body)',
	':root',
	'html',
	'body',
];

function replaceDoublePrefix( selector, prefix ) {
	// Avoid prefixing an already prefixed selector.
	const doublePrefix = `${ prefix } ${ prefix }`;
	if ( selector.includes( doublePrefix ) ) {
		return selector.replace( doublePrefix, prefix );
	}
	return selector;
}

function transformStyle(
	{ css, ignoredSelectors = [], baseURL },
	wrapperSelector = ''
) {
	// When there is no wrapper selector and no base URL, there is no need
	// to transform the CSS. This is most cases because in the default
	// iframed editor, no wrapping is needed, and not many styles
	// provide a base URL.
	if ( ! wrapperSelector && ! baseURL ) {
		return css;
	}
	try {
		return postcss(
			[
				wrapperSelector &&
					prefixSelector( {
						prefix: wrapperSelector,
						exclude: [ ...ignoredSelectors, wrapperSelector ],
						transform( prefix, selector, prefixedSelector ) {
							// `html`, `body` and `:root` need some special handling since they
							// generally cannot be prefixed with a class name and produce a valid
							// selector. Instead we replace the whole root part of the selector.

							const rootSelector = ROOT_SELECTORS.find(
								( rootSelectorCandidate ) =>
									selector.startsWith( rootSelectorCandidate )
							);

							// Reorganize root selectors such that the root part comes before the prefix,
							// but the prefix still becomes any other part of the selector.
							if ( rootSelector ) {
								const selectorWithoutRootPart = selector
									.replace( rootSelector, '' )
									.trim();
								const updatedRootSelector =
									`${ rootSelector } ${ prefix } ${ selectorWithoutRootPart }`.trim();

								return replaceDoublePrefix(
									updatedRootSelector,
									prefix
								);
							}

							return replaceDoublePrefix(
								prefixedSelector,
								prefix
							);
						},
					} ),
				baseURL && rebaseUrl( { rootUrl: baseURL } ),
			].filter( Boolean )
		).process( css, {} ).css; // use sync PostCSS API
	} catch ( error ) {
		if ( error instanceof CssSyntaxError ) {
			// eslint-disable-next-line no-console
			console.warn(
				'wp.blockEditor.transformStyles Failed to transform CSS.',
				error.message + '\n' + error.showSourceCode( false )
			);
		} else {
			// eslint-disable-next-line no-console
			console.warn(
				'wp.blockEditor.transformStyles Failed to transform CSS.',
				error
			);
		}

		return null;
	}
}

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
	let cache = cacheByWrapperSelector.get( wrapperSelector );
	if ( ! cache ) {
		cache = new WeakMap();
		cacheByWrapperSelector.set( wrapperSelector, cache );
	}
	return styles.map( ( style ) => {
		let css = cache.get( style );
		if ( ! css ) {
			css = transformStyle( style, wrapperSelector );
			cache.set( style, css );
		}
		return css;
	} );
};

export default transformStyles;
