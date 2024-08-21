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
	wrapperSelector = '',
	transformOptions
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
						exclude: [
							...ignoredSelectors,
							...( transformOptions?.ignoredSelectors ?? [] ),
							wrapperSelector,
						],
						transform( prefix, selector, prefixedSelector ) {
							const rootSelector = ROOT_SELECTORS.find(
								( rootSelectorCandidate ) =>
									selector.startsWith( rootSelectorCandidate )
							);

							// Reorganize root selectors such that the root part comes before the prefix,
							// but the prefix still comes before the remaining part of the selector.
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
 * @typedef {Object} EditorStyle
 * @property {string}    css              the CSS block(s), as a single string.
 * @property {?string}   baseURL          the base URL to be used as the reference when rewritting urls.
 * @property {?string[]} ignoredSelectors the selectors not to wrap.
 */

/**
 * @typedef {Object} TransformOptions
 * @property {?string[]} ignoredSelectors the selectors not to wrap.
 */

/**
 * Applies a series of CSS rule transforms to wrap selectors inside a given class and/or rewrite URLs depending on the parameters passed.
 *
 * @param {EditorStyle[]}    styles           CSS rules.
 * @param {string}           wrapperSelector  Wrapper selector.
 * @param {TransformOptions} transformOptions Additional options for style transformation.
 * @return {Array} converted rules.
 */
const transformStyles = ( styles, wrapperSelector = '', transformOptions ) => {
	let cache = cacheByWrapperSelector.get( wrapperSelector );
	if ( ! cache ) {
		cache = new WeakMap();
		cacheByWrapperSelector.set( wrapperSelector, cache );
	}
	return styles.map( ( style ) => {
		let css = cache.get( style );
		if ( ! css ) {
			css = transformStyle( style, wrapperSelector, transformOptions );
			cache.set( style, css );
		}
		return css;
	} );
};

export default transformStyles;
