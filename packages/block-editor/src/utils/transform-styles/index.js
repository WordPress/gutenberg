/**
 * External dependencies
 */
import postcss from 'postcss';
import wrap from 'postcss-prefixwrap';
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
		return postcss(
			[
				wrapperClassName &&
					wrap( `.${ wrapperClassName }`, {
						prefixRootTags: true,
					} ),
				rebaseUrl( { rootUrl: baseURL } ),
			].filter( Boolean )
		).process( css, {} ).css; // use sync PostCSS API
	} );
};

export default transformStyles;
