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
import { LinkControl, useBlockEditingMode } from '@wordpress/block-editor';
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

/**
 * Internal dependencies
 */
import { LinkUIPageCreator } from './page-creator';
import LinkUIBlockInserter from './block-inserter';
import { useEntityBinding } from '../shared/use-entity-binding';

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
	const { clientId } = props;
	const postType = type || 'page';

	const [ addingBlock, setAddingBlock ] = useState( false );
	const [ addingPage, setAddingPage ] = useState( false );
	const [ shouldFocusPane, setShouldFocusPane ] = useState( null );
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
		} ),
		[ label, opensInNewTab, url, kind, type, id ]
	);

	const handlePageCreated = ( pageLink ) => {
		// Set the new page as the current link
		props.onChange( pageLink );
		// Return to main Link UI and focus the first focusable element
		setAddingPage( false );
		setShouldFocusPane( true );
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
					} }
					onPageCreated={ handlePageCreated }
					initialTitle={ link?.url || '' }
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
} ) => {
	const blockInserterAriaRole = 'listbox';

	// Don't render anything if neither button should be shown
	if ( ! canAddPage && ! canAddBlock ) {
		return null;
	}

	return (
		<VStack spacing={ 0 } className="link-ui-tools">
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
