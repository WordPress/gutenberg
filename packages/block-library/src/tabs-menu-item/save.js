/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	// Build CSS custom properties for active/hover colors
	const customColorStyles = {};

	// Active/hover colors from custom attributes
	if ( attributes.customActiveBackgroundColor ) {
		customColorStyles[ '--custom-tab-active-color' ] =
			attributes.customActiveBackgroundColor;
	}
	if ( attributes.customActiveTextColor ) {
		customColorStyles[ '--custom-tab-active-text-color' ] =
			attributes.customActiveTextColor;
	}
	if ( attributes.customHoverBackgroundColor ) {
		customColorStyles[ '--custom-tab-hover-color' ] =
			attributes.customHoverBackgroundColor;
	}
	if ( attributes.customHoverTextColor ) {
		customColorStyles[ '--custom-tab-hover-text-color' ] =
			attributes.customHoverTextColor;
	}

	// useBlockProps.save includes all core style engine classes and styles
	// The button content is replaced by PHP during rendering, so we output
	// an empty button as a template.
	const blockProps = useBlockProps.save( {
		className: 'wp-block-tabs-menu-item__template',
		style: customColorStyles,
		type: 'button',
		role: 'tab',
	} );

	return <button { ...blockProps } />;
}
