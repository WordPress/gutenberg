/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ColorControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { GlobalStylesPanelBody } from '../global-styles-panel-body';
import { useGlobalStylesState } from '../store';

export default function ColorControls() {
	const {
		textColor,
		backgroundColor,
		primaryColor,
		setStyles,
	} = useGlobalStylesState();

	return (
		<GlobalStylesPanelBody title={ __( 'Colors' ) } initialOpen={ false }>
			<ColorControl
				label={ __( 'Text' ) }
				value={ textColor }
				onChange={ ( value ) => setStyles( { textColor: value } ) }
			/>
			<ColorControl
				label={ __( 'Background' ) }
				value={ backgroundColor }
				onChange={ ( value ) =>
					setStyles( { backgroundColor: value } )
				}
			/>
			<ColorControl
				label={ __( 'Primary' ) }
				value={ primaryColor }
				onChange={ ( value ) => setStyles( { primaryColor: value } ) }
			/>
		</GlobalStylesPanelBody>
	);
}
