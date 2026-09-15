import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Button,
	FlexItem,
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalItemGroup as ItemGroup,
	__experimentalText as WCText,
} from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu, VisuallyHidden } from '@wordpress/ui';
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
import {
	button,
	caption,
	chevronUpDown,
	formInput,
	funnel,
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
	link,
	quote,
} from '@wordpress/icons';
import { useBlockVariations } from './variations/variations-panel';
import { ScreenHeader } from './screen-header';
import { NavigationButtonAsItem } from './navigation-button';
import { Subtitle } from './subtitle';
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

interface ElementItem {
	/** The element's key under `styles.elements`. */
	name: string;
	icon: any;
	label: string;
}

/*
 * Elements are listed alongside blocks, grouped under subheadings, so that
 * anything styleable is one list away rather than behind its own drilldown.
 * Labels are singular to match how blocks are listed.
 */
const ELEMENT_GROUPS: { title: string; elements: ElementItem[] }[] = [
	{
		title: __( 'Elements' ),
		elements: [
			{ name: 'link', icon: link, label: __( 'Link' ) },
			{ name: 'caption', icon: caption, label: __( 'Caption' ) },
			{ name: 'cite', icon: quote, label: __( 'Citation' ) },
		],
	},
	{
		title: __( 'Headings' ),
		elements: [
			{ name: 'h1', icon: headingLevel1, label: __( 'Heading 1' ) },
			{ name: 'h2', icon: headingLevel2, label: __( 'Heading 2' ) },
			{ name: 'h3', icon: headingLevel3, label: __( 'Heading 3' ) },
			{ name: 'h4', icon: headingLevel4, label: __( 'Heading 4' ) },
			{ name: 'h5', icon: headingLevel5, label: __( 'Heading 5' ) },
			{ name: 'h6', icon: headingLevel6, label: __( 'Heading 6' ) },
		],
	},
	{
		title: __( 'Form controls' ),
		elements: [
			{ name: 'textInput', icon: formInput, label: __( 'Input' ) },
			{ name: 'select', icon: chevronUpDown, label: __( 'Select' ) },
			// Disambiguated from the Button block, which sits further down
			// the same list.
			{ name: 'button', icon: button, label: __( 'Button (element)' ) },
		],
	},
];

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

/**
 * Whether the user has customized an element.
 *
 * Reads the user layer only, for the same reason as blocks: the merged config
 * would match most elements, because themes style them.
 *
 * @param user        The user's global styles config.
 * @param elementName The element to check, e.g. `button` or `h2`.
 * @return Whether the user has any styles for that element.
 */
export function hasUserStylesForElement(
	user: GlobalStylesConfig | undefined,
	elementName: string
): boolean {
	return hasAnyValue( user?.styles?.elements?.[ elementName ] );
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

function ElementMenuItem( {
	element,
	isCustomized,
}: {
	element: ElementItem;
	isCustomized: boolean;
} ) {
	return (
		<NavigationButtonAsItem path={ '/blocks/elements/' + element.name }>
			<HStack justify="flex-start" spacing={ 2 }>
				<BlockIcon
					className="global-styles-ui-block-types-item__icon"
					icon={ element.icon }
				/>
				<FlexItem>{ element.label }</FlexItem>
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

interface ListGroupProps {
	title: string;
	children: React.ReactNode;
}

function ListGroup( { title, children }: ListGroupProps ) {
	return (
		<div className="global-styles-ui-block-types-group">
			<div className="global-styles-ui-block-types-group__title">
				<Subtitle level={ 3 }>{ title }</Subtitle>
			</div>
			{ children }
		</div>
	);
}

function EmptyList( {
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
			? __( "You haven't customized any blocks or elements yet." )
			: __( 'No results found.' );
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

interface ListProps {
	filterValue: string;
	styleFilter: StyleFilter;
}

function getFilteredElementGroups(
	filterValue: string,
	styleFilter: StyleFilter,
	customizedElementNames: Set< string >
) {
	const search = filterValue.trim().toLowerCase();
	return ELEMENT_GROUPS.map( ( group ) => ( {
		...group,
		elements: group.elements.filter(
			( element ) =>
				( ! search ||
					element.label.toLowerCase().includes( search ) ) &&
				( styleFilter !== 'customized' ||
					customizedElementNames.has( element.name ) )
		),
	} ) ).filter( ( group ) => group.elements.length > 0 );
}

function BlockAndElementList( { filterValue, styleFilter }: ListProps ) {
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

	const customizedElementNames = useMemo( () => {
		const names = new Set< string >();
		Object.keys( user?.styles?.elements ?? {} ).forEach( ( name ) => {
			if ( hasUserStylesForElement( user, name ) ) {
				names.add( name );
			}
		} );
		return names;
	}, [ user ] );

	const filteredElementGroups = getFilteredElementGroups(
		filterValue,
		styleFilter,
		customizedElementNames
	);

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
	const elementCount = filteredElementGroups.reduce(
		( total, group ) => total + group.elements.length,
		0
	);

	// Announce result count on change
	const hasBlockResults = filteredBlockTypes.length > 0;
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
		const blockCount = hasBlockResults
			? blockTypesListRef.current?.childElementCount || 0
			: 0;
		const count = elementCount + blockCount;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage, 'polite' );
	}, [
		filterValue,
		styleFilter,
		hasBlockResults,
		elementCount,
		debouncedSpeak,
	] );

	if ( ! elementCount && ! hasBlockResults ) {
		return (
			<EmptyList
				filterValue={ filterValue }
				styleFilter={ styleFilter }
			/>
		);
	}

	return (
		<>
			{ filteredElementGroups.map( ( group ) => (
				<ListGroup key={ group.title } title={ group.title }>
					<ItemGroup>
						{ group.elements.map( ( element ) => (
							<ElementMenuItem
								key={ element.name }
								element={ element }
								isCustomized={ customizedElementNames.has(
									element.name
								) }
							/>
						) ) }
					</ItemGroup>
				</ListGroup>
			) ) }
			{ hasBlockResults && (
				<ListGroup title={ __( 'Blocks' ) }>
					<div
						ref={ blockTypesListRef }
						className="global-styles-ui-block-types-item-list"
						// By default, BlockMenuItem has a role=listitem so this div must have a list role.
						role="list"
					>
						{ filteredBlockTypes.map( ( block ) => (
							<BlockMenuItem
								block={ block }
								isCustomized={ customizedBlockNames.has(
									block.name
								) }
								key={ 'menu-itemblock-' + block.name }
							/>
						) ) }
					</div>
				</ListGroup>
			) }
		</>
	);
}

const MemoizedBlockAndElementList = memo( BlockAndElementList );

function ScreenBlockList() {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ styleFilter, setStyleFilter ] = useState< StyleFilter >( 'all' );
	const deferredFilterValue = useDeferredValue( filterValue );

	return (
		<>
			<ScreenHeader
				title={ __( 'Blocks & Elements' ) }
				description={ __(
					'Customize the appearance of specific blocks and elements for the whole site.'
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
				<Menu.Root>
					<Menu.Trigger
						render={
							<Button
								size="compact"
								icon={ funnel }
								label={ __( 'Filter blocks' ) }
								isPressed={ styleFilter !== 'all' }
							/>
						}
					/>
					<Menu.Popup>
						<Menu.RadioGroup
							value={ styleFilter }
							onValueChange={ ( value: StyleFilter ) =>
								setStyleFilter( value )
							}
						>
							<Menu.RadioItem value="all" closeOnClick>
								<Menu.ItemLabel>
									{ __( 'All blocks' ) }
								</Menu.ItemLabel>
							</Menu.RadioItem>
							<Menu.RadioItem value="customized" closeOnClick>
								<Menu.ItemLabel>
									{ __( 'Customized' ) }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						</Menu.RadioGroup>
					</Menu.Popup>
				</Menu.Root>
			</HStack>
			<MemoizedBlockAndElementList
				filterValue={ deferredFilterValue }
				styleFilter={ styleFilter }
			/>
		</>
	);
}

export default ScreenBlockList;
