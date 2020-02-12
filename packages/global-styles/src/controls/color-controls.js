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
		setTextColor,
		backgroundColor,
		setBackgroundColor,
		primaryColor,
		setPrimaryColor,
	} = useGlobalStylesState();

	return (
		<GlobalStylesPanelBody title={ __( 'Colors' ) } initialOpen={ false }>
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
		</GlobalStylesPanelBody>
	);
}
