/**
 * WordPress dependencies
 */
// @ts-expect-error: Not typed yet.
import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	FlexItem,
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	useState,
	useEffect,
	useRef,
	useDeferredValue,
	memo,
} from '@wordpress/element';
import {
	BlockIcon,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error: Not typed yet.
} from '@wordpress/block-editor';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { useBlockVariations } from './variations/variations-panel';
import { ScreenHeader } from './screen-header';
import { NavigationButtonAsItem } from './navigation-button';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useSettingsForBlockElement,
	useHasColorPanel,
} = unlock( blockEditorPrivateApis );

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
	const groupByType = ( blocks: any, block: any ) => {
		const { core, noncore } = blocks;
		const type = block.name.startsWith( 'core/' ) ? core : noncore;
		type.push( block );
		return blocks;
	};
	const { core: coreItems, noncore: nonCoreItems } = blockItems.reduce(
		groupByType,
		{ core: [], noncore: [] }
	);
	return [ ...coreItems, ...nonCoreItems ];
}

export function useBlockHasGlobalStyles( blockName: string ) {
	const [ rawSettings ] = useSetting( '', blockName );
	const settings = useSettingsForBlockElement( rawSettings, blockName );
	const hasTypographyPanel = useHasTypographyPanel( settings );
	const hasColorPanel = useHasColorPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;
	const hasVariationsPanel = !! useBlockVariations( blockName )?.length;
	const hasGlobalStyles =
		hasTypographyPanel ||
		hasColorPanel ||
		hasLayoutPanel ||
		hasVariationsPanel;
	return hasGlobalStyles;
}

interface BlockMenuItemProps {
	block: any;
}

function BlockMenuItem( { block }: BlockMenuItemProps ) {
	const hasBlockMenuItem = useBlockHasGlobalStyles( block.name );
	if ( ! hasBlockMenuItem ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ '/blocks/' + encodeURIComponent( block.name ) }
		>
			<HStack justify="flex-start">
				<BlockIcon icon={ block.icon } />
				<FlexItem>{ block.title }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

interface BlockListProps {
	filterValue: string;
}

function BlockList( { filterValue }: BlockListProps ) {
	const sortedBlockTypes = useSortedBlockTypes();
	const debouncedSpeak = useDebounce( speak, 500 );
	// @ts-expect-error - useSelect supports single argument calls
	const { isMatchingSearchTerm } = useSelect( blocksStore );

	const filteredBlockTypes = ! filterValue
		? sortedBlockTypes
		: sortedBlockTypes.filter( ( blockType ) =>
				isMatchingSearchTerm( blockType, filterValue )
		  );

	const blockTypesListRef = useRef< HTMLDivElement >( null );

	// Announce search results on change
	useEffect( () => {
		if ( ! filterValue ) {
			return;
		}
		// We extract the results from the wrapper div's `ref` because
		// filtered items can contain items that will eventually not
		// render and there is no reliable way to detect when a child
		// will return `null`.
		// TODO: We should find a better way of handling this as it's
		// fragile and depends on the number of rendered elements of `BlockMenuItem`,
		// which is now one.
		// @see https://github.com/WordPress/gutenberg/pull/39117#discussion_r816022116
		const count = blockTypesListRef.current?.childElementCount || 0;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage, 'polite' );
	}, [ filterValue, debouncedSpeak ] );

	return (
		<div
			ref={ blockTypesListRef }
			className="global-styles-ui-block-types-item-list"
			// By default, BlockMenuItem has a role=listitem so this div must have a list role.
			role="list"
		>
			{ filteredBlockTypes.length === 0 ? (
				<Text align="center" as="p">
					{ __( 'No blocks found.' ) }
				</Text>
			) : (
				filteredBlockTypes.map( ( block ) => (
					<BlockMenuItem
						block={ block }
						key={ 'menu-itemblock-' + block.name }
					/>
				) )
			) }
		</div>
	);
}

const MemoizedBlockList = memo( BlockList );

function ScreenBlockList() {
	const [ filterValue, setFilterValue ] = useState( '' );
	const deferredFilterValue = useDeferredValue( filterValue );

	return (
		<>
			<ScreenHeader
				title={ __( 'Blocks' ) }
				description={ __(
					'Customize the appearance of specific blocks and for the whole site.'
				) }
			/>
			<SearchControl
				__nextHasNoMarginBottom
				className="global-styles-ui-block-types-search"
				onChange={ setFilterValue }
				value={ filterValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
			/>
			<MemoizedBlockList filterValue={ deferredFilterValue } />
		</>
	);
}

export default ScreenBlockList;
