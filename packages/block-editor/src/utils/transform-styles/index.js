/**
 * External dependencies
 */
import postcss from 'postcss';
import wrap from 'postcss-editor-styles';
import rebaseUrl from 'postcss-urlrebase';

/**
 * Applies a series of CSS rule transforms to wrap selectors inside a given class and/or rewrite URLs depending on the parameters passed.
 *
 * @param {Object|Array} styles           CSS rules.
 * @param {string}       wrapperClassName Wrapper Class Name.
 * @return {Array} converted rules.
 */
const transformStyles = ( styles, wrapperClassName = '' ) => {
	return Object.values( styles ?? [] ).map( ( { css, baseURL } ) => {
		return postcss( [
			wrap( { scopeTo: wrapperClassName } ),
			rebaseUrl( { rootUrl: baseURL } ),
		] ).process( css, {} );
	} );
};

export default transformStyles;
