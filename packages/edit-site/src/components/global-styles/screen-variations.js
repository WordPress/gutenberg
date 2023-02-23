/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
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

export function ScreenVariations( { name, path } ) {
	const hasVariationsPanel = useHasVariationsPanel( name, path );
	const blockTitle = useSelect(
		( select ) => select( blocksStore ).getBlockType( name ).title,
		[ name ]
	);

	if ( ! hasVariationsPanel ) {
		return null;
	}
	return (
		<div className="edit-site-global-styles-screen-variations">
			<VStack spacing={ 3 }>
				<p>
					{ sprintf(
						// Translators: Name of the block.
						__( 'Customize variations of the block: %s' ),
						blockTitle
					) }
				</p>
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
