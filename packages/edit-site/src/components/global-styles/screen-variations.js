/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
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
import Subtitle from './subtitle';

export function ScreenVariations( { name, path = '' } ) {
	const hasVariationsPanel = useHasVariationsPanel( name, path );

	if ( ! hasVariationsPanel ) {
		return null;
	}
	return (
		<div className="edit-site-global-styles-screen-variations">
			<VStack spacing={ 3 }>
				<p>Manage style variations, saved block appearence presets.</p>
				<Subtitle>{ __( 'Style Variations' ) }</Subtitle>
				<VariationsPanel name={ name } />
			</VStack>
		</div>
	);
}

export function ScreenVariation( { blockName, style } ) {
	const { name: styleName, label: styleLabel } = style;
	return (
		<>
			<ScreenHeader title={ styleLabel } />
			<BlockPreviewPanel
				name={ blockName }
				variation={ `is-style-${ styleName }` }
			/>
			<VariationPanel blockName={ blockName } styleName={ styleName } />
		</>
	);
}
