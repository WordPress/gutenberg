/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ColorControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useGlobalStylesState } from '../store';

export default function ColorsPanel() {
	const {
		textColor,
		setTextColor,
		backgroundColor,
		setBackgroundColor,
		primaryColor,
		setPrimaryColor,
	} = useGlobalStylesState();

	return (
		<PanelBody title={ __( 'Colors' ) } initialOpen={ false }>
			<ColorControl
				label={ __( 'Text' ) }
				value={ textColor }
				onChange={ setTextColor }
			/>
			<ColorControl
				label={ __( 'Background' ) }
				value={ backgroundColor }
				onChange={ setBackgroundColor }
			/>
			<ColorControl
				label={ __( 'Primary' ) }
				value={ primaryColor }
				onChange={ setPrimaryColor }
			/>
		</PanelBody>
	);
}
