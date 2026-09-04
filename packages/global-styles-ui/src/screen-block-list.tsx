import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	FlexItem,
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalItemGroup as ItemGroup,
	__experimentalText as WCText,
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
import {
	caption,
	heading,
	link,
	quote,
	settings as settingsIcon,
	typography,
} from '@wordpress/icons';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { useBlockVariations } from './variations/variations-panel';
import { ScreenHeader } from './screen-header';
import { NavigationButtonAsItem } from './navigation-button';
import { Subtitle } from './subtitle';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const {
	useHasDimensionsPanel,
	useHasTypographyPanel,
	useHasBorderPanel,
	useSettingsForBlockElement,
	useHasColorPanel,
	useHasBackgroundPanel,
} = unlock( blockEditorPrivateApis );

const ELEMENTS = [
	{ icon: typography, label: __( 'Text' ), path: '/blocks/elements/text' },
	{ icon: link, label: __( 'Links' ), path: '/blocks/elements/link' },
	{
		icon: heading,
		label: __( 'Headings' ),
		path: '/blocks/elements/heading',
	},
	{
		icon: caption,
		label: __( 'Captions' ),
		path: '/blocks/elements/caption',
	},
	{ icon: quote, label: __( 'Citations' ), path: '/blocks/elements/cite' },
	{
		icon: settingsIcon,
		label: __( 'Form controls' ),
		path: '/blocks/elements/form-controls',
	},
];

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

interface ListProps {
	filterValue: string;
}

function getFilteredElements( filterValue: string ) {
	const search = filterValue.trim().toLowerCase();
	if ( ! search ) {
		return ELEMENTS;
	}
	return ELEMENTS.filter( ( { label } ) =>
		label.toLowerCase().includes( search )
	);
}

function BlockAndElementList( { filterValue }: ListProps ) {
	const sortedBlockTypes = useSortedBlockTypes();
	const debouncedSpeak = useDebounce( speak, 500 );
	const { isMatchingSearchTerm } = useSelect( blocksStore );

	const filteredElements = getFilteredElements( filterValue );
	const filteredBlockTypes = ! filterValue
		? sortedBlockTypes
		: sortedBlockTypes.filter( ( blockType ) =>
				isMatchingSearchTerm( blockType, filterValue )
		  );

	const blockTypesListRef = useRef< HTMLDivElement >( null );
	const elementCount = filteredElements.length;

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
		const count =
			elementCount +
			( blockTypesListRef.current?.childElementCount || 0 );
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage, 'polite' );
	}, [ filterValue, elementCount, debouncedSpeak ] );

	if ( ! elementCount && ! filteredBlockTypes.length ) {
		return (
			<WCText align="center" as="p">
				{ __( 'No results found.' ) }
			</WCText>
		);
	}

	return (
		<>
			{ elementCount > 0 && (
				<ListGroup title={ __( 'Elements' ) }>
					<ItemGroup>
						{ filteredElements.map( ( { icon, label, path } ) => (
							<NavigationButtonAsItem
								key={ path }
								icon={ icon }
								path={ path }
							>
								{ label }
							</NavigationButtonAsItem>
						) ) }
					</ItemGroup>
				</ListGroup>
			) }
			{ filteredBlockTypes.length > 0 && (
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
	const deferredFilterValue = useDeferredValue( filterValue );

	return (
		<>
			<ScreenHeader
				title={ __( 'Blocks & Elements' ) }
				description={ __(
					'Customize the appearance of specific blocks and elements for the whole site.'
				) }
			/>
			<SearchControl
				className="global-styles-ui-block-types-search"
				onChange={ setFilterValue }
				value={ filterValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
			/>
			<MemoizedBlockAndElementList filterValue={ deferredFilterValue } />
		</>
	);
}

export default ScreenBlockList;
