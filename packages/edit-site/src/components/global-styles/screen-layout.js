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

function ScreenLayout( { name } ) {
	const hasDimensionsPanel = useHasDimensionsPanel( name );

	return (
		<>
			<ScreenHeader title={ __( 'Layout' ) } />
			<BlockPreviewPanel name={ name } />
			{ hasDimensionsPanel && <DimensionsPanel name={ name } /> }
		</>
	);
}

export default ScreenLayout;
