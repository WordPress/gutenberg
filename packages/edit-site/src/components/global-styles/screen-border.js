/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BorderPanel, { useHasBorderPanel } from './border-panel';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';

function ScreenBorder( { name, variation = '' } ) {
	const hasBorderPanel = useHasBorderPanel( name );
	const variationClassName = getVariationClassName( variation );
	return (
		<>
			<ScreenHeader title={ __( 'Border & Shadow' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasBorderPanel && (
				<BorderPanel name={ name } variation={ variation } />
			) }
		</>
	);
}

export default ScreenBorder;
