import { __unstableStripHTML as stripHTML, focus } from '@wordpress/dom';
import {
	Popover,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	LinkControl,
	useBlockEditingMode,
	store as blockEditorStore,
	BlockIcon,
} from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useMemo,
	useState,
	useRef,
	useEffect,
	forwardRef,
} from '@wordpress/element';
import { useResourcePermissions } from '@wordpress/core-data';
import { plus } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/ui';
import { isURL } from '@wordpress/url';
import { LinkUIPageCreator } from './page-creator';
import LinkUIBlockInserter from './block-inserter';
import { useEntityBinding, useLinkPreview } from '../shared';

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {{ type?: string, subtype?: string }} Search query params.
 */
export function getSuggestionsQuery( type, kind ) {
	// How many results to show initially and per search.
	const perPage = 20;

	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type, perPage };
		case 'category':
			return { type: 'term', subtype: 'category', perPage };
		case 'tag':
			return { type: 'term', subtype: 'post_tag', perPage };
		case 'post_format':
			return { type: 'post-format', perPage };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type, perPage };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type, perPage };
			}
			return {
				// for custom link which has no type
				// always show pages as initial suggestions
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage,
				},
			};
	}
}

const EXCLUDED = new Set( [
	'core/navigation-link',
	'core/navigation-submenu',
] );

function getVariationBadgeLabel( variation ) {
	if ( variation.attributes?.kind === 'post-type' ) {
		/* translators: %s: Post type name (e.g. "Post", "Page", "CPT", "Taxonomy"). */
		return sprintf( __( '%s link' ), variation.attributes?.type );
	}
	if ( variation.attributes?.kind === 'taxonomy' ) {
		return __( 'taxonomy' );
	}
	return __( 'Link' );
}
const matchesQuery = ( query, title = '', keywords = [] ) =>
	title.toLowerCase().includes( query ) ||
	keywords.some( ( kw ) => kw.toLowerCase().includes( query ) );

function UnforwardedLinkUI( props, ref ) {
	const { label, url, opensInNewTab, type, kind, id } = props.link;
	const { onBlockInsert, onClose } = props;

	const { entityRecord, hasBinding, isEntityAvailable } = props.entity || {};

	const { image, badges } = useLinkPreview( {
		url,
		entityRecord,
		type,
		hasBinding,
		isEntityAvailable,
	} );

	const { clientId } = props;
	const postType = type || 'page';

	const [ addingBlock, setAddingBlock ] = useState( false );
	const [ addingPage, setAddingPage ] = useState( false );
	const [ shouldFocusPane, setShouldFocusPane ] = useState( null );
	// Stable initial value for LinkControl's uncontrolled inputValue prop.
	// We track the search with the searchInputValueRef, then update the
	// initialSearchValue state with the observed searchInputValueRef
	// when mounting the LinkControl. If LinkControl becomes a fully
	// controlled component, then we can remove this extra complexity.
	const [ initialSearchValue, setInitialSearchValue ] = useState( '' );
	// Tracks the live search input between renders without causing re-renders.
	const searchInputValueRef = useRef( '' );
	const [ searchInputValue, setSearchInputValue ] = useState( '' );
	// Call this instead of setting searchInputValueRef.current and
	// setInitialSearchValue separately, to keep both in sync.
	const updateSearchValue = ( value ) => {
		searchInputValueRef.current = value;
		setInitialSearchValue( value );
		setSearchInputValue( value );
	};
	const linkControlWrapperRef = useRef();
	const addPageButtonRef = useRef();
	const addBlockButtonRef = useRef();
	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: postType,
	} );

	// Use the entity binding hook to get binding status
	const { isBoundEntityAvailable } = useEntityBinding( {
		clientId,
		attributes: props.link,
	} );

	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/50976#issuecomment-1568226407.
	const link = useMemo(
		() => ( {
			url,
			opensInNewTab,
			title: label && stripHTML( label ),
			entityTitle: entityRecord?.title?.rendered || entityRecord?.name,
			kind,
			type,
			id,
			image,
			badges,
		} ),
		[
			label,
			opensInNewTab,
			url,
			kind,
			type,
			id,
			image,
			badges,
			entityRecord,
		]
	);

	const handlePageCreated = ( pageLink ) => {
		// Set the new page as the current link
		props.onChange( pageLink );
		// Return to main Link UI and focus the first focusable element
		setAddingPage( false );
		setShouldFocusPane( true );
		// Clear search input value
		updateSearchValue( '' );
	};

	const dialogTitleId = useInstanceId(
		LinkUI,
		'link-ui-link-control__title'
	);
	const dialogDescriptionId = useInstanceId(
		LinkUI,
		'link-ui-link-control__description'
	);

	// Focus management when transitioning between panes
	useEffect( () => {
		if ( shouldFocusPane && linkControlWrapperRef.current ) {
			// If we have a specific element to focus, focus it
			if ( shouldFocusPane?.current ) {
				// Focus the specific element passed
				shouldFocusPane.current.focus();
			} else {
				// Focus the first tabbable element (keyboard-accessible, excluding tabindex="-1")
				const tabbableElements = focus.tabbable.find(
					linkControlWrapperRef.current
				);
				const nextFocusTarget =
					tabbableElements[ 0 ] || linkControlWrapperRef.current;
				nextFocusTarget.focus();
			}

			// Reset the state
			setShouldFocusPane( false );
		}
	}, [ shouldFocusPane ] );

	const blockEditingMode = useBlockEditingMode();
	const {
		rootClientId,
		insertionIndex,
		allBlockTypes,
		canInsertBlockType,
		navigationLinkVariations,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockIndex,
				canInsertBlockType: _canInsert,
			} = select( blockEditorStore );
			const { getBlockVariations } = select( blocksStore );
			const root = getBlockRootClientId( props.clientId );

			return {
				rootClientId: root,
				insertionIndex: getBlockIndex( props.clientId ) + 1,
				allBlockTypes: root
					? select( blocksStore ).getBlockTypes()
					: [],
				canInsertBlockType: _canInsert,
				navigationLinkVariations: root
					? getBlockVariations( 'core/navigation-link', 'inserter' )
					: [],
			};
		},
		[ props.clientId ]
	);

	const { insertBlock } = useDispatch( blockEditorStore );

	// Filter insertable blocks by both capabilities AND the live search input in one pass.
	// Empty query > no results (avoids flooding the UI before the user types).
	const matchingItems = useMemo( () => {
		const query = searchInputValue.trim().toLowerCase();

		if ( ! query || ! rootClientId || ( type && url ) ) {
			return [];
		}

		const variations = ( navigationLinkVariations ?? [] )
			.filter(
				( v ) =>
					( v.title ?? '' ).toLowerCase() !== 'page link' &&
					matchesQuery( query, v.title, v.keywords )
			)
			.map( ( v ) => ( {
				key: `${ v.name }-${ v.title }`,
				icon: v.icon ?? 'admin-links',
				/* translators: %s: Variation title (e.g., "Category", "Posts") */
				label: sprintf( __( 'Add %s' ), v.title ),
				badge: getVariationBadgeLabel( v ),
				onInsert() {
					const block = createBlock(
						'core/navigation-link',
						v.attributes ?? {}
					);
					insertBlock( block, insertionIndex, rootClientId );
					onBlockInsert?.( block );
					onClose?.();
				},
			} ) );

		const blocks = allBlockTypes
			.filter(
				( bt ) =>
					! EXCLUDED.has( bt.name ) &&
					canInsertBlockType( bt.name, rootClientId ) &&
					matchesQuery( query, bt.title, bt.keywords )
			)
			.map( ( bt ) => ( {
				key: bt.name,
				icon: bt.icon,
				/* translators: %s: Block title (e.g., "Site Logo") */
				label: sprintf( __( 'Add %s Block' ), bt.title ),
				badge: __( 'Block' ),
				onInsert() {
					const block = createBlock( bt.name );
					insertBlock( block, insertionIndex, rootClientId );
					onBlockInsert?.( block );
					onClose?.();
				},
			} ) );

		return [ ...variations, ...blocks ];
	}, [
		searchInputValue,
		navigationLinkVariations,
		allBlockTypes,
		canInsertBlockType,
		rootClientId,
		insertionIndex,
		insertBlock,
		onBlockInsert,
		onClose,
		type,
		url,
	] );

	return (
		<Popover
			ref={ ref }
			placement="bottom"
			onClose={ props.onClose }
			anchor={ props.anchor }
			shift
		>
			{ ! addingBlock && ! addingPage && (
				<div
					ref={ linkControlWrapperRef }
					role="dialog"
					aria-labelledby={ dialogTitleId }
					aria-describedby={ dialogDescriptionId }
				>
					<VisuallyHidden>
						<h2 id={ dialogTitleId }>{ __( 'Add link' ) }</h2>

						<p id={ dialogDescriptionId }>
							{ __(
								'Search for and add a link to your Navigation.'
							) }
						</p>
					</VisuallyHidden>
					<LinkControl
						hasTextControl
						hasRichPreviews
						value={ link }
						showInitialSuggestions
						withCreateSuggestion={ false }
						noDirectEntry={ !! type }
						noURLSuggestion={ !! type }
						suggestionsQuery={ getSuggestionsQuery( type, kind ) }
						onChange={ props.onChange }
						onInputChange={ ( value ) => {
							// Observe the input value so we can pass the value to the page creator
							// and restore it on back button click
							searchInputValueRef.current = value;
							setSearchInputValue( value );
						} }
						inputValue={ initialSearchValue }
						onRemove={ props.onRemove }
						onCancel={ props.onCancel }
						handleEntities={ isBoundEntityAvailable }
						forceIsEditingLink={ link?.url ? false : undefined }
						renderControlBottom={ () => {
							// Don't show the tools when there is submitted link (preview state).
							if ( link?.url?.length ) {
								return null;
							}

							return (
								<LinkUITools
									addPageButtonRef={ addPageButtonRef }
									addBlockButtonRef={ addBlockButtonRef }
									setAddingBlock={ () => {
										setAddingBlock( true );
									} }
									setAddingPage={ () => {
										setAddingPage( true );
									} }
									canAddPage={
										blockEditingMode !== 'disabled' &&
										permissions?.canCreate &&
										type === 'page'
									}
									canAddBlock={
										blockEditingMode !== 'disabled'
									}
									matchingItems={ matchingItems }
								/>
							);
						} }
					/>
				</div>
			) }

			{ addingBlock && (
				<LinkUIBlockInserter
					clientId={ props.clientId }
					onBack={ () => {
						setAddingBlock( false );
						setShouldFocusPane( addBlockButtonRef );
						updateSearchValue( searchInputValueRef.current );
					} }
					onBlockInsert={ props?.onBlockInsert }
				/>
			) }

			{ addingPage && (
				<LinkUIPageCreator
					postType={ postType }
					onBack={ () => {
						setAddingPage( false );
						setShouldFocusPane( addPageButtonRef );
						updateSearchValue( searchInputValueRef.current );
					} }
					onPageCreated={ handlePageCreated }
					initialTitle={
						searchInputValueRef.current &&
						! isURL( searchInputValueRef.current )
							? searchInputValueRef.current
							: ''
					}
				/>
			) }
		</Popover>
	);
}

export const LinkUI = forwardRef( UnforwardedLinkUI );

const LinkUITools = ( {
	addPageButtonRef,
	addBlockButtonRef,
	setAddingBlock,
	setAddingPage,
	canAddPage,
	canAddBlock,
	matchingItems = [],
} ) => {
	const blockInserterAriaRole = 'listbox';

	// Don't render anything if neither button should be shown
	if ( ! canAddPage && ! canAddBlock && matchingItems.length === 0 ) {
		return null;
	}

	return (
		<VStack spacing={ 0 } className="link-ui-tools">
			{ canAddPage &&
				canAddBlock &&
				matchingItems.map( ( item ) => (
					<Button
						__next40pxDefaultSize
						key={ item.key }
						icon={ <BlockIcon icon={ item.icon } /> }
						onClick={ ( e ) => {
							e.preventDefault();
							item.onInsert();
						} }
						aria-haspopup={ blockInserterAriaRole }
					>
						{ item.label }
						<span className="link-ui-suggestion-item__badge">
							{ item.badge }
						</span>
					</Button>
				) ) }
			{ canAddPage && (
				<Button
					__next40pxDefaultSize
					ref={ addPageButtonRef }
					icon={ plus }
					onClick={ ( e ) => {
						e.preventDefault();
						setAddingPage( true );
					} }
					aria-haspopup={ blockInserterAriaRole }
				>
					{ __( 'Create page' ) }
				</Button>
			) }
			{ canAddBlock && (
				<Button
					__next40pxDefaultSize
					ref={ addBlockButtonRef }
					icon={ plus }
					onClick={ ( e ) => {
						e.preventDefault();
						setAddingBlock( true );
					} }
					aria-haspopup={ blockInserterAriaRole }
				>
					{ __( 'Add block' ) }
				</Button>
			) }
		</VStack>
	);
};

export default LinkUITools;
