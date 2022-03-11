/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	FlexItem,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useHasBorderPanel } from './border-panel';
import { useHasColorPanel } from './color-utils';
import { useHasDimensionsPanel } from './dimensions-panel';
import { useHasTypographyPanel } from './typography-panel';
import ScreenHeader from './header';
import { NavigationButton } from './navigation-button';

function useSortedBlockTypes() {
	const blockItems = useSelect(
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);
	// Ensure core blocks are prioritized in the returned results,
	// because third party blocks can be registered earlier than
	// the core blocks (usually by using the `init` action),
	// thus affecting the display order.
	// We don't sort reusable blocks as they are handled differently.
	const groupByType = ( blocks, block ) => {
		const { core, noncore } = blocks;
		const type = block.name.startsWith( 'core/' ) ? core : noncore;
		type.push( block );
		return blocks;
	};
	const {
		core: coreItems,
		noncore: nonCoreItems,
	} = blockItems.reduce( groupByType, { core: [], noncore: [] } );
	return [ ...coreItems, ...nonCoreItems ];
}

function BlockMenuItem( { block } ) {
	const hasTypographyPanel = useHasTypographyPanel( block.name );
	const hasColorPanel = useHasColorPanel( block.name );
	const hasBorderPanel = useHasBorderPanel( block.name );
	const hasDimensionsPanel = useHasDimensionsPanel( block.name );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;
	const hasBlockMenuItem =
		hasTypographyPanel || hasColorPanel || hasLayoutPanel;

	if ( ! hasBlockMenuItem ) {
		return null;
	}

	return (
		<NavigationButton path={ '/blocks/' + block.name }>
			<HStack justify="flex-start">
				<FlexItem>
					<BlockIcon icon={ block.icon } />
				</FlexItem>
				<FlexItem>{ block.title }</FlexItem>
			</HStack>
		</NavigationButton>
	);
}

function ScreenBlockList() {
	const sortedBlockTypes = useSortedBlockTypes();
	return (
		<>
			<ScreenHeader
				title={ __( 'Blocks' ) }
				description={ __(
					'Customize the appearance of specific blocks and for the whole site.'
				) }
			/>
			{ sortedBlockTypes.map( ( block ) => (
				<BlockMenuItem
					block={ block }
					key={ 'menu-itemblock-' + block.name }
				/>
			) ) }
		</>
	);
}

export default ScreenBlockList;
