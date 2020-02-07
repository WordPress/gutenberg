/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useGlobalStylesState } from '../store';

export default function QuotePanel() {
	const { quoteFontSize, setQuoteFontSize } = useGlobalStylesState();

	return (
		<PanelBody title={ __( 'Block Quote 🧪' ) } initialOpen={ false }>
			<RangeControl
				label={ __( 'Font Size' ) }
				value={ quoteFontSize }
				onChange={ setQuoteFontSize }
				min={ 10 }
				max={ 50 }
				step={ 1 }
			/>
		</PanelBody>
	);
}
