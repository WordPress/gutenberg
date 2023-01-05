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
import { getVariationClassNameFromPath } from './utils';

function ScreenBorder( { name, variationPath = '' } ) {
	const hasBorderPanel = useHasBorderPanel( name );
	const variationClassName = getVariationClassNameFromPath( variationPath );
	return (
		<>
			<ScreenHeader title={ __( 'Border' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasBorderPanel && (
				<BorderPanel name={ name } variationPath={ variationPath } />
			) }
		</>
	);
}

export default ScreenBorder;
