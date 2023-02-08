/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DimensionsPanel, { useHasDimensionsPanel } from './dimensions-panel';
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';

function ScreenLayout( { name, variation = '' } ) {
	const hasDimensionsPanel = useHasDimensionsPanel( name );
	const variationClassName = getVariationClassName( variation );
	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasDimensionsPanel && (
				<DimensionsPanel name={ name } variation={ variation } />
			) }
		</>
	);
}

export default ScreenLayout;
