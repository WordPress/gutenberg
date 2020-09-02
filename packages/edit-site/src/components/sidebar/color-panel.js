/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
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
			colorValue: getProperty( name, 'color', 'text' ),
			onColorChange: ( value ) =>
				setProperty( name, 'color.text', value ),
			label: __( 'Text color' ),
		} );
	}

	// TODO: check for gradient support, etc
	if ( supports.includes( BACKGROUND_COLOR ) ) {
		settings.push( {
			colorValue: getProperty( name, 'color', 'background' ),
			onColorChange: ( value ) =>
				setProperty( name, 'color.background', value ),
			gradientValue: getProperty( name, 'color', 'gradient' ),
			onGradientChange: ( value ) =>
				setProperty( name, 'color.gradient', value ),
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		settings.push( {
			colorValue: getProperty( name, 'color', 'link' ),
			onColorChange: ( value ) =>
				setProperty( name, 'color.link', value ),
			label: __( 'Link color' ),
		} );
	}

	return (
		<PanelColorGradientSettings
			title={ __( 'Color' ) }
			settings={ settings }
		/>
	);
};
