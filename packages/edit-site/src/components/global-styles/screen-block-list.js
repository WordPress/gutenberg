/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import { useHasBorderPanel } from './border-panel';
import { useHasColorPanel } from './color-panel';
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import ScreenHeader from './header';
import NavigationButton from './navigation-button';

function BlockMenuItem( { block } ) {
	const { blocks } = useGlobalStylesContext();
	const context = blocks[ block.name ];
	const hasTypographyPanel = useHasTypographyPanel( context );
	const hasColorPanel = useHasColorPanel( context );
	const hasBorderPanel = useHasBorderPanel( context );
	const hasDimensionsPanel = useHasDimensionsPanel( context );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;
	const hasBlockMenuItem =
		hasTypographyPanel || hasColorPanel || hasLayoutPanel;

	if ( ! hasBlockMenuItem ) {
		return null;
	}

	return (
		<NavigationButton path={ '/blocks/' + block.name }>
			{ block.title }
		</NavigationButton>
	);
}

function ScreenBlockList() {
	const { blocks } = useGlobalStylesContext();
	const visibleBlocks = Object.keys( blocks )
		.map( ( name ) => getBlockType( name ) )
		.filter( ( blockType ) => !! blockType );

	return (
		<>
			<ScreenHeader back="/" title={ __( 'Blocks' ) } />
			{ visibleBlocks.map( ( block ) => (
				<BlockMenuItem
					block={ block }
					key={ 'menu-itemblock-' + block.name }
				/>
			) ) }
		</>
	);
}

export default ScreenBlockList;
