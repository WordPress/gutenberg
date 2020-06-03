/**
 * External dependencies
 */
import { map, compose } from 'lodash';

/**
 * Internal dependencies
 */
import urlRewrite from './transforms/url-rewrite';
import wrap from './transforms/wrap';
import traverse from './traverse';

/**
 * Applies a series of CSS rule transforms to wrap selectors inside a given class and/or rewrite URLs depending on the parameters passed.
 *
 * @param {Array} styles CSS rules.
 * @param {string} wrapperClassName Wrapper Class Name.
 * @return {Array} converted rules.
 */
const transformStyles = ( styles, wrapperClassName = '' ) => {
	return map( styles, ( { css, baseURL } ) => {
		const transforms = [];
		if ( wrapperClassName ) {
			transforms.push( wrap( wrapperClassName ) );
		}
		if ( baseURL ) {
			transforms.push( urlRewrite( baseURL ) );
		}
		return traverse( css, compose( transforms ) );
	} );
};

export default transformStyles;
