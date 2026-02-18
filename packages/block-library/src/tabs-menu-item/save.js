/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	// We add our custom classes and the hidden attribute for PHP template extraction
	const blockProps = useBlockProps.save( {
		className: 'wp-block-tabs-menu-item__template',
		style: customColorStyles,
		hidden: true,
		type: 'button',
		role: 'tab',
	} );

	return (
		<button { ...blockProps }>
			<span className="screen-reader-text">
				{ __( 'Tab menu item' ) }
			</span>
		</button>
	);
}
