/**
 * External dependencies
 */
import classnames from 'classnames';

export default function getWidthProps( { style } ) {
	const width = style?.dimensions?.width;
	const presetWidth = [ 25, 50, 75, 100 ].find(
		( preset ) => `${ preset }%` === width
	);
	const customWidth = width && ! presetWidth ? width : undefined;

	const className = classnames( {
		[ `has-custom-width` ]: width,
		[ `wp-block-button__width-${ presetWidth }` ]: presetWidth,
	} );

	return {
		className: className || undefined,
		style: { width: customWidth },
	};
}
