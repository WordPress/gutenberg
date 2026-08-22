import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalText as WCText,
} from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import {
	useState,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useDeferredValue,
	memo,
} from '@wordpress/element';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
import {
	BlockIcon,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error: Not typed yet.
} from '@wordpress/block-editor';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { funnel } from '@wordpress/icons';
import { useBlockVariations } from './variations/variations-panel';
import { ScreenHeader } from './screen-header';
import { NavigationButtonAsItem } from './navigation-button';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';
import { GlobalStylesContext } from './context';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useSettingsForBlockElement,
	useHasColorPanel,
	useHasBackgroundPanel,
} = unlock( blockEditorPrivateApis );

const { Menu } = unlock( componentsPrivateApis );

/**
 * Whether a value, or anything nested inside it, holds a real user value.
 *
 * A user entry can survive as an empty husk: clearing a value writes
 * `undefined` in place rather than removing the key, so
 * `{ color: { text: undefined } }` means "not customized". An empty string
 * and zero are real values — an intentionally blank CSS string is still a
 * user entry.
 *
 * @param value The value to inspect.
 * @return Whether the value holds at least one leaf value.
 */
function hasAnyValue( value: unknown ): boolean {
	if ( value === undefined || value === null ) {
		return false;
	}
	if ( Array.isArray( value ) ) {
		return value.length > 0;
	}
	if ( typeof value === 'object' ) {
		return Object.values( value ).some( hasAnyValue );
	}
	return true;
}

/**
 * Whether the user has customized a block.
 *
 * Per-block user data lives under two roots: `styles.blocks` for style values
 * and `settings.blocks` for things like a block-specific color palette. Either
 * one counts as a customization, and both are resettable by the user.
 *
 * Reads the user layer only. The merged config would match nearly every block,
 * because themes style most of them.
 *
 * @param user      The user's global styles config.
 * @param blockName The block to check, e.g. `core/quote`.
 * @return Whether the user has any styles or settings for that block.
 */
export function hasUserStylesForBlock(
	user: GlobalStylesConfig | undefined,
	blockName: string
): boolean {
	return (
		hasAnyValue( user?.styles?.blocks?.[ blockName ] ) ||
		hasAnyValue( user?.settings?.blocks?.[ blockName ] )
	);
}

type StyleFilter = 'all' | 'customized';

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
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	const hasBorderPanel = useHasBorderPanel( settings );
	const hasDimensionsPanel = useHasDimensionsPanel( settings );
	const hasLayoutPanel = hasBorderPanel || hasDimensionsPanel;
	const hasVariationsPanel = !! useBlockVariations( blockName )?.length;
	const hasGlobalStyles =
		hasTypographyPanel ||
		hasColorPanel ||
		hasBackgroundPanel ||
		hasLayoutPanel ||
		hasVariationsPanel;
	return hasGlobalStyles;
}

interface BlockMenuItemProps {
	block: any;
	isCustomized: boolean;
}

function BlockMenuItem( { block, isCustomized }: BlockMenuItemProps ) {
	const hasBlockMenuItem = useBlockHasGlobalStyles( block.name );
	if ( ! hasBlockMenuItem ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ '/blocks/' + encodeURIComponent( block.name ) }
		>
			<HStack justify="flex-start" spacing={ 2 }>
				<BlockIcon
					className="global-styles-ui-block-types-item__icon"
					icon={ block.icon }
				/>
				<FlexItem>{ block.title }</FlexItem>
				{ isCustomized && (
					<>
						<VisuallyHidden>
							{ __( 'Has custom styles' ) }
						</VisuallyHidden>
						<span
							aria-hidden="true"
							className="global-styles-ui-block-types-item__indicator"
						/>
					</>
				) }
			</HStack>
		</NavigationButtonAsItem>
	);
}

function EmptyBlockList( {
	filterValue,
	styleFilter,
}: {
	filterValue: string;
	styleFilter: StyleFilter;
} ) {
	// While searching, an empty list means the search matched nothing, whether
	// or not the customized filter is also on.
	const label =
		'customized' === styleFilter && ! filterValue
			? __( "You haven't customized any blocks yet." )
			: __( 'No blocks found.' );
	return (
		<WCText
			align="center"
			as="p"
			className="global-styles-ui-block-types-item-list__no-results"
		>
			{ label }
		</WCText>
	);
}

interface BlockListProps {
	filterValue: string;
	styleFilter: StyleFilter;
}

function BlockList( { filterValue, styleFilter }: BlockListProps ) {
	const sortedBlockTypes = useSortedBlockTypes();
	const debouncedSpeak = useDebounce( speak, 500 );
	const { isMatchingSearchTerm } = useSelect( blocksStore );
	const { user } = useContext( GlobalStylesContext );

	// Computed once for the whole list rather than per row, so the list does
	// not open a context subscription for every registered block.
	const customizedBlockNames = useMemo( () => {
		const names = new Set< string >();
		const blockNames = [
			...Object.keys( user?.styles?.blocks ?? {} ),
			...Object.keys( user?.settings?.blocks ?? {} ),
		];
		blockNames.forEach( ( blockName ) => {
			if ( hasUserStylesForBlock( user, blockName ) ) {
				names.add( blockName );
			}
		} );
		return names;
	}, [ user ] );

	const searchedBlockTypes = ! filterValue
		? sortedBlockTypes
		: sortedBlockTypes.filter( ( blockType ) =>
				isMatchingSearchTerm( blockType, filterValue )
		  );

	const filteredBlockTypes =
		styleFilter === 'customized'
			? searchedBlockTypes.filter( ( blockType ) =>
					customizedBlockNames.has( blockType.name )
			  )
			: searchedBlockTypes;

	const blockTypesListRef = useRef< HTMLDivElement >( null );

	// Announce result count on change
	const hasResults = filteredBlockTypes.length > 0;
	useEffect( () => {
		if ( ! filterValue && styleFilter === 'all' ) {
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
		// An empty list renders the empty state message as its only child, so
		// only count the children when there are results to count.
		const count = hasResults
			? blockTypesListRef.current?.childElementCount || 0
			: 0;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage, 'polite' );
	}, [ filterValue, styleFilter, hasResults, debouncedSpeak ] );

	return (
		<div
			ref={ blockTypesListRef }
			className="global-styles-ui-block-types-item-list"
			// By default, BlockMenuItem has a role=listitem so this div must have a list role.
			role="list"
		>
			{ filteredBlockTypes.length === 0 ? (
				<EmptyBlockList
					filterValue={ filterValue }
					styleFilter={ styleFilter }
				/>
			) : (
				filteredBlockTypes.map( ( block ) => (
					<BlockMenuItem
						block={ block }
						isCustomized={ customizedBlockNames.has( block.name ) }
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
	const [ styleFilter, setStyleFilter ] = useState< StyleFilter >( 'all' );
	const deferredFilterValue = useDeferredValue( filterValue );

	return (
		<>
			<ScreenHeader
				title={ __( 'Blocks' ) }
				description={ __(
					'Customize the appearance of specific blocks and for the whole site.'
				) }
			/>
			<HStack
				className="global-styles-ui-block-types-filter"
				alignment="center"
				spacing={ 2 }
			>
				<SearchControl
					className="global-styles-ui-block-types-search"
					onChange={ setFilterValue }
					value={ filterValue }
					label={ __( 'Search' ) }
					placeholder={ __( 'Search' ) }
					size="compact"
				/>
				<Menu>
					<Menu.TriggerButton
						render={
							<Button
								size="compact"
								icon={ funnel }
								label={ __( 'Filter blocks' ) }
								isPressed={ styleFilter !== 'all' }
							/>
						}
					/>
					<Menu.Popover>
						<Menu.RadioItem
							name="global-styles-block-filter"
							value="all"
							checked={ styleFilter === 'all' }
							onChange={ () => setStyleFilter( 'all' ) }
							hideOnClick
						>
							<Menu.ItemLabel>
								{ __( 'All blocks' ) }
							</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem
							name="global-styles-block-filter"
							value="customized"
							checked={ styleFilter === 'customized' }
							onChange={ () => setStyleFilter( 'customized' ) }
							hideOnClick
						>
							<Menu.ItemLabel>
								{ __( 'Customized' ) }
							</Menu.ItemLabel>
						</Menu.RadioItem>
					</Menu.Popover>
				</Menu>
			</HStack>
			<MemoizedBlockList
				filterValue={ deferredFilterValue }
				styleFilter={ styleFilter }
			/>
		</>
	);
}

export default ScreenBlockList;
