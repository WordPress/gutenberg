/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useGlobalStylesState } from '../store';

export default function HeadingPanel() {
	const { headingFontWeight, setHeadingFontWeight } = useGlobalStylesState();

	return (
		<PanelBody title={ __( 'Heading 🧪' ) } initialOpen={ false }>
			<RangeControl
				label={ __( 'Font Weight' ) }
				value={ headingFontWeight }
				onChange={ setHeadingFontWeight }
				min={ 100 }
				max={ 900 }
				step={ 100 }
			/>
		</PanelBody>
	);
}
