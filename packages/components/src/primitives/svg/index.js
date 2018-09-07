/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

const SVG = ( props ) => {
	const appliedProps = {
		...props,
		role: 'img',
		'aria-hidden': 'true',
		focusable: 'false',
	};

	return <svg { ...appliedProps } />;
};

export default SVG;

export const AccessibleSVG = ( props ) => {
	deprecated( 'wp.components.AccessibleSVG', {
		version: '4.0',
		alternative: 'wp.components.SVG',
		plugin: 'Gutenberg',
	} );
	return <SVG { ...props } />;
};
