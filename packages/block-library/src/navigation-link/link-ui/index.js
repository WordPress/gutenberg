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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	useMemo,
	useCallback,
	useState,
	useRef,
	useEffect,
	forwardRef,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useResourcePermissions } from '@wordpress/core-data';
import { plus } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';
import { isURL } from '@wordpress/url';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { LinkUIPageCreator } from './page-creator';
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
				// For custom links which have no type,
				// show all content types as initial suggestions.
				initialSuggestionsSearchOptions: {
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
	// Call this instead of setting searchInputValueRef.current and
	// setInitialSearchValue separately, to keep both in sync.
	const updateSearchValue = ( value ) => {
		searchInputValueRef.current = value;
		setInitialSearchValue( value );
	};
	const linkControlWrapperRef = useRef();
	const addPageButtonRef = useRef();
	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: postType,
	} );

	const { rootBlockClientId, fetchLinkSuggestions, inserterItems } =
		useSelect(
			( select ) => {
				const { getBlockRootClientId, getSettings, getInserterItems } =
					select( blockEditorStore );
				const rootId = getBlockRootClientId( clientId );
				return {
					rootBlockClientId: rootId,
					fetchLinkSuggestions:
						getSettings().__experimentalFetchLinkSuggestions,
					inserterItems: rootId ? getInserterItems( rootId ) : [],
				};
			},
			[ clientId ]
		);

	const { insertBlock } = useDispatch( blockEditorStore );

	// Build block suggestions from inserter items for the parent navigation block.
	// Filter out navigation-link and navigation-submenu (and their variations) since
	// those are content links already covered by the API search results.
	const blockSuggestions = useMemo(
		() =>
			inserterItems
				.filter(
					( item ) =>
						! item.isDisabled &&
						! item.id.startsWith( 'core/navigation-link' )
				)
				.map( ( item ) => ( {
					id: `block-${ item.name }`,
					title: item.title,
					url: '',
					type: 'block',
					kind: 'block',
					blockName: item.name,
					icon: item.icon,
				} ) ),
		[ inserterItems ]
	);

	// Custom fetch function that merges block suggestions with content results.
	// In the initial state (no query), always includes the Home Link block.
	const handleFetchSuggestions = useCallback(
		async ( search, searchOptions ) => {
			const isInitial = !! searchOptions?.isInitialSuggestions;

			const matchingBlocks = blockSuggestions.filter( ( suggestion ) => {
				if ( ! search || isInitial ) {
					return suggestion.blockName === 'core/home-link';
				}
				return suggestion.title
					.toLowerCase()
					.includes( search.toLowerCase() );
			} );

			const contentResults = fetchLinkSuggestions
				? await fetchLinkSuggestions( search, searchOptions )
				: [];

			return [ ...matchingBlocks, ...contentResults ];
		},
		[ blockSuggestions, fetchLinkSuggestions ]
	);

	// Handle link change — intercept block suggestions and insert the block instead.
	const handleChange = useCallback(
		( suggestion ) => {
			if ( suggestion.kind === 'block' ) {
				insertBlock(
					createBlock( suggestion.blockName ),
					undefined,
					rootBlockClientId
				);
				props.onClose?.();
				return;
			}
			props.onChange( suggestion );
		},
		[ insertBlock, rootBlockClientId, props.onChange, props.onClose ]
	);

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

	return (
		<Popover
			ref={ ref }
			placement="bottom"
			onClose={ props.onClose }
			anchor={ props.anchor }
			shift
		>
			{ ! addingPage && (
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
						onChange={ handleChange }
						onInputChange={ ( value ) => {
							// Observe the input value so we can pass the value to the page creator
							// and restore it on back button click
							searchInputValueRef.current = value;
						} }
						inputValue={ initialSearchValue }
						onRemove={ props.onRemove }
						onCancel={ props.onCancel }
						handleEntities={ isBoundEntityAvailable }
						forceIsEditingLink={ link?.url ? false : undefined }
						fetchSuggestions={ handleFetchSuggestions }
						renderControlBottom={ () => {
							// Don't show the tools when there is submitted link (preview state).
							if ( link?.url?.length ) {
								return null;
							}

							return (
								<LinkUITools
									addPageButtonRef={ addPageButtonRef }
									setAddingPage={ () => {
										setAddingPage( true );
									} }
									canAddPage={
										permissions?.canCreate &&
										( ! type || type === 'page' )
									}
								/>
							);
						} }
					/>
				</div>
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

const LinkUITools = ( { addPageButtonRef, setAddingPage, canAddPage } ) => {
	const blockInserterAriaRole = 'listbox';

	if ( ! canAddPage ) {
		return null;
	}

	return (
		<VStack spacing={ 0 } className="link-ui-tools">
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
		</VStack>
	);
};

export default LinkUITools;
