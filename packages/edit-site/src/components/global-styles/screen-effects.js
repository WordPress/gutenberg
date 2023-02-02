/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import ShadowPanel, { useHasShadowControl } from './shadow-panel';

function ScreenEffects( { name, variation = '' } ) {
	const variationClassName = getVariationClassName( variation );
	const hasShadowPanel = useHasShadowControl( name );
	return (
		<>
			<ScreenHeader title={ __( 'Shadow' ) } />
			<BlockPreviewPanel name={ name } variation={ variationClassName } />
			{ hasShadowPanel && (
				<ShadowPanel name={ name } variation={ variation } />
			) }
		</>
	);
}

export default ScreenEffects;
