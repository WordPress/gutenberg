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

function ScreenBorder( { name, variationPath = '' } ) {
	const hasBorderPanel = useHasBorderPanel( name );
	return (
		<>
			<ScreenHeader title={ __( 'Border' ) } />
			<BlockPreviewPanel name={ name } />
			{ hasBorderPanel && (
				<BorderPanel name={ name } variationPath={ variationPath } />
			) }
		</>
	);
}

export default ScreenBorder;
