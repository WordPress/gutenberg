/**
 * WordPress dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BACKGROUND_COLOR, LINK_COLOR, TEXT_COLOR } from '../editor/utils';

export default ( {
	context: { supports, name },
	getProperty,
	setProperty,
} ) => {
	if (
		! supports.includes( TEXT_COLOR ) &&
		! supports.includes( BACKGROUND_COLOR ) &&
		! supports.includes( LINK_COLOR )
	) {
		return null;
	}

	const settings = [];

	if ( supports.includes( TEXT_COLOR ) ) {
		settings.push( {
			value: getProperty( name, 'color', 'text' ),
			onChange: ( value ) => setProperty( name, 'color', 'text', value ),
			label: __( 'Text color' ),
		} );
	}

	if ( supports.includes( BACKGROUND_COLOR ) ) {
		settings.push( {
			value: getProperty( name, 'color', 'background' ),
			onChange: ( value ) =>
				setProperty( name, 'color', 'background', value ),
			label: __( 'Background color' ),
		} );
	}

	// TODO: do gradients

	if ( supports.includes( LINK_COLOR ) ) {
		settings.push( {
			value: getProperty( name, 'color', 'link' ),
			onChange: ( value ) => setProperty( name, 'color', 'link', value ),
			label: __( 'Link color' ),
		} );
	}

	return (
		<PanelColorSettings
			title={ __( 'Color' ) }
			colorSettings={ settings }
		/>
	);
};
