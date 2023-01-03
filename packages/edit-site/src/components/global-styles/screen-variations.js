/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	VariationPanel,
	VariationsPanel,
	useHasVariationsPanel,
} from './variations-panel';
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';

export function ScreenVariations( { name, path = '' } ) {
	const hasVariationsPanel = useHasVariationsPanel( name, path );

	if ( ! hasVariationsPanel ) {
		return null;
	}
	return (
		<>
			<ScreenHeader
				title={ __( 'Style Variations' ) }
				description={ __( 'Customise style variations.' ) }
			/>
			<VariationsPanel name={ name } />
		</>
	);
}

export function ScreenVariation( { blockName, styleName } ) {
	return (
		<>
			<ScreenHeader title={ styleName } />
			<BlockPreviewPanel
				name={ blockName }
				variation={ `is-style-${ styleName }` }
			/>
			<VariationPanel blockName={ blockName } styleName={ styleName } />
		</>
	);
}
