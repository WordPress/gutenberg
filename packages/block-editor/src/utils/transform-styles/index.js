/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import traverse from './traverse';
import urlRewrite from './transforms/url-rewrite';
import wrap from './transforms/wrap';

import { createStyleElem, textFromStyleSheet } from './parse/stylesheets';

/**
 * Applies a series of CSS rule transforms to wrap selectors inside a given class and/or rewrite URLs depending on the parameters passed.
 *
 * @param {Array}  styles           CSS rules.
 * @param {string} wrapperClassName Wrapper Class Name.
 * @return {Array} converted rules.
 */
const transformStyles = ( styles, wrapperClassName = '' ) => {
	return Object.values( styles ?? [] ).map( ( { css, baseURL } ) => {
		const transforms = [];
		if ( wrapperClassName ) {
			transforms.push( wrap( wrapperClassName ) );
		}
		if ( baseURL ) {
			transforms.push( urlRewrite( baseURL ) );
		}
		if ( transforms.length ) {
			const styleEl = createStyleElem( css );
			const cssstyleSheet = styleEl.sheet;

			traverse( cssstyleSheet, compose( transforms ) );

			const cssOut = textFromStyleSheet( cssstyleSheet );
			styleEl.remove(); // clean up
			return cssOut;
		}
		return css;
	} );
};

export default transformStyles;
