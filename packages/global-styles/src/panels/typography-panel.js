/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useGlobalStylesState } from '../store';

export default function TypographyPanel() {
	const {
		fontSize,
		setFontSize,
		fontScale,
		setFontScale,
		lineHeight,
		setLineHeight,
		fontWeight,
		setFontWeight,
	} = useGlobalStylesState();

	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ false }>
			<RangeControl
				label={ __( 'Font Size' ) }
				value={ fontSize }
				min={ 10 }
				max={ 30 }
				step={ 1 }
				onChange={ setFontSize }
			/>
			<RangeControl
				label={ __( 'Font Scale' ) }
				value={ fontScale }
				min={ 1.1 }
				max={ 1.4 }
				step={ 0.025 }
				onChange={ setFontScale }
			/>
			<RangeControl
				label={ __( 'Line Height' ) }
				value={ lineHeight }
				min={ 1 }
				max={ 2 }
				step={ 0.1 }
				onChange={ setLineHeight }
			/>
			<RangeControl
				label={ __( 'Font Weight' ) }
				value={ fontWeight }
				min={ 100 }
				max={ 900 }
				step={ 100 }
				onChange={ setFontWeight }
			/>
		</PanelBody>
	);
}
