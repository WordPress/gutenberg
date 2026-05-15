/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML, focus } from '@wordpress/dom';
import {
	Popover,
	Button,
	VisuallyHidden,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
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

function UnforwardedLinkUI( props, ref ) {
	const { label, url, opensInNewTab, type, kind, id } = props.link;

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
			kind,
			type,
			id,
			image,
			badges,
		} ),
		[ label, opensInNewTab, url, kind, type, id, image, badges ]
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
	const { rootClientId, insertableNavigationBlocks } = useSelect(
		( select ) => {
			const { getBlockRootClientId, canInsertBlockType } =
				select( blockEditorStore );
			const root = getBlockRootClientId( props.clientId );

			// Get every registered block type that can live inside this navigation.
			// Exclude navigation-link and navigation-submenu — those are already
			// handled by LinkControl's own search suggestions.
			const EXCLUDED = new Set( [
				'core/navigation-link',
				'core/navigation-submenu',
			] );
			const insertable = select( blocksStore )
				.getBlockTypes()
				.filter(
					( blockType ) =>
						! EXCLUDED.has( blockType.name ) &&
						canInsertBlockType( blockType.name, root )
				);

			return {
				rootClientId: root,
				insertableNavigationBlocks: insertable,
			};
		},
		[ props.clientId ]
	);

	// Filter insertable blocks by the live search input.
	// Empty query > no results (avoids flooding the UI before the user types).
	const matchingBlocks = useMemo( () => {
		const query = searchInputValue.trim().toLowerCase();
		if ( ! query ) {
			return [];
		}
		return insertableNavigationBlocks.filter( ( blockType ) => {
			const title = blockType.title.toLowerCase();
			const keywords = ( blockType.keywords ?? [] ).map( ( k ) =>
				k.toLowerCase()
			);
			return (
				title.includes( query ) ||
				keywords.some( ( kw ) => kw.includes( query ) )
			);
		} );
	}, [ searchInputValue, insertableNavigationBlocks ] );

	const { insertBlock } = useDispatch( blockEditorStore );

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
										permissions?.canCreate &&
										type === 'page'
									}
									canAddBlock={
										blockEditingMode === 'default'
									}
									matchingBlocks={ matchingBlocks }
									onInsertBlock={ ( blockType ) => {
										const newBlock = createBlock(
											blockType.name
										);
										insertBlock(
											newBlock,
											undefined,
											rootClientId
										);
										if ( props.onBlockInsert ) {
											props.onBlockInsert( newBlock );
										}
										props.onClose?.();
									} }
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
	matchingBlocks = [],
	onInsertBlock,
} ) => {
	const blockInserterAriaRole = 'listbox';

	// Don't render anything if neither button should be shown
	if ( ! canAddPage && ! canAddBlock && matchingBlocks.length === 0 ) {
		return null;
	}

	return (
		<VStack spacing={ 0 } className="link-ui-tools">
			{ matchingBlocks.map( ( blockType ) => (
				<Button
					__next40pxDefaultSize
					key={ blockType.name }
					icon={ <BlockIcon icon={ blockType.icon } /> }
					onClick={ ( e ) => {
						e.preventDefault();
						onInsertBlock( blockType );
					} }
				>
					{ __( 'Add' ) } { blockType.title } { __( 'Block' ) }
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
