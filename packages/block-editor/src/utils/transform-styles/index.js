/**
 * External dependencies
 */
import * as parsel from 'parsel-js';
import Processor from 'postcss/lib/processor';
import CssSyntaxError from 'postcss/lib/css-syntax-error';
import prefixSelector from 'postcss-prefix-selector';
import rebaseUrl from 'postcss-urlrebase';

const cacheByWrapperSelector = new Map();

const ROOT_SELECTOR_TOKENS = [
	{ type: 'type', content: 'body' },
	{ type: 'type', content: 'html' },
	{ type: 'pseudo-class', content: ':root' },
	{ type: 'pseudo-class', content: ':where(body)' },
	{ type: 'pseudo-class', content: ':where(:root)' },
	{ type: 'pseudo-class', content: ':where(html)' },
];

/**
 * Prefixes root selectors in a way that ensures consistent specificity.
 * This requires special handling, since prefixing a classname before
 * html, body, or :root will generally result in an invalid selector.
 *
 * Some libraries will simply replace the root selector with the prefix
 * instead, but this results in inconsistent specificity.
 *
 * This function instead inserts the prefix after the root tags but before
 * any other part of the selector. This results in consistent specificity:
 * - If a `:where()` selector is used for the prefix, all selectors output
 *   by `transformStyles` will have no specificity increase.
 * - If a classname, id, or something else is used as the prefix, all selectors
 *   will have the same specificity bump when transformed.
 *
 * @param {string} prefix   The prefix.
 * @param {string} selector The selector.
 *
 * @return {string} The prefixed root selector.
 */
function prefixRootSelector( prefix, selector ) {
	// Use a tokenizer, since regular expressions are unreliable.
	const tokenized = parsel.tokenize( selector );

	// Find the last token that contains a root selector by walking back
	// through the tokens.
	const lastRootIndex = tokenized.findLastIndex( ( { content, type } ) => {
		return ROOT_SELECTOR_TOKENS.some(
			( rootSelector ) =>
				content === rootSelector.content && type === rootSelector.type
		);
	} );

	// Walk forwards to find the combinator after the last root.
	// This is where the root ends and the rest of the selector begins,
	// and the index to insert before.
	// Doing it this way takes into account that a root selector like
	// 'body' may have additional id/class/pseudo-class/attribute-selector
	// parts chained to it, which is difficult to quantify using a regex.
	let insertionPoint = -1;
	for ( let i = lastRootIndex + 1; i < tokenized.length; i++ ) {
		if ( tokenized[ i ].type === 'combinator' ) {
			insertionPoint = i;
			break;
		}
	}

	// Tokenize and insert the prefix with a ' ' combinator before it.
	const tokenizedPrefix = parsel.tokenize( prefix );
	tokenized.splice(
		// Insert at the insertion point, or the end.
		insertionPoint === -1 ? tokenized.length : insertionPoint,
		0,
		{
			type: 'combinator',
			content: ' ',
		},
		...tokenizedPrefix
	);

	return parsel.stringify( tokenized );
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
		const excludedSelectors = [
			...ignoredSelectors,
			...( transformOptions?.ignoredSelectors ?? [] ),
			wrapperSelector,
		];

		return new Processor(
			[
				wrapperSelector &&
					prefixSelector( {
						prefix: wrapperSelector,
						transform( prefix, selector, prefixedSelector ) {
							// For backwards compatibility, don't use the `exclude` option
							// of postcss-prefix-selector, instead handle it here to match
							// the behavior of the old library (postcss-prefix-wrap) that
							// `transformStyle` previously used.
							if (
								excludedSelectors.some( ( excludedSelector ) =>
									excludedSelector instanceof RegExp
										? selector.match( excludedSelector )
										: selector.includes( excludedSelector )
								)
							) {
								return selector;
							}

							const hasRootSelector = ROOT_SELECTOR_TOKENS.some(
								( rootSelector ) =>
									selector.startsWith( rootSelector.content )
							);

							// Reorganize root selectors such that the root part comes before the prefix,
							// but the prefix still comes before the remaining part of the selector.
							if ( hasRootSelector ) {
								return prefixRootSelector( prefix, selector );
							}

							return prefixedSelector;
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
