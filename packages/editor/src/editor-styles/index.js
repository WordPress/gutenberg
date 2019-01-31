/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * External dependencies
 */
import traverse from './traverse';
import urlRewrite from './transforms/url-rewrite';
import wrap from './transforms/wrap';

/**
 * Convert css rules.
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
		if ( transforms.length ) {
			return traverse( css, compose( transforms ) );
		}

		return css;
	} );
};

export default transformStyles;
