/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
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

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {{ type?: string, subtype?: string }} Search query params.
 */
export function getSuggestionsQuery( type, kind ) {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			return {
				// for custom link which has no type
				// always show pages as initial suggestions
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 20,
				},
			};
	}
}

function UnforwardedLinkUI( props, ref ) {
	const { label, url, opensInNewTab, type, kind, id, metadata } = props.link;
	const postType = type || 'page';

	const [ addingBlock, setAddingBlock ] = useState( false );
	const [ addingPage, setAddingPage ] = useState( false );
	const [ focusAddBlockButton, setFocusAddBlockButton ] = useState( false );
	const [ focusAddPageButton, setFocusAddPageButton ] = useState( false );
	const permissions = useResourcePermissions( {
		kind: 'postType',
		name: postType,
	} );

	// Check if there's a URL binding with the new binding sources
	// Only enable handleEntities when there's actually a binding present
	const hasUrlBinding =
		( metadata?.bindings?.url?.source === 'core/post-data' ||
			metadata?.bindings?.url?.source === 'core/term-data' ) &&
		!! id;

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
		// Return to main Link UI
		setAddingPage( false );
	};

	const dialogTitleId = useInstanceId(
		LinkUI,
		'link-ui-link-control__title'
	);
	const dialogDescriptionId = useInstanceId(
		LinkUI,
		'link-ui-link-control__description'
	);

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
						handleEntities={ hasUrlBinding }
						renderControlBottom={ () => {
							// Don't show the tools when there is submitted link (preview state).
							if ( link?.url?.length ) {
								return null;
							}

							return (
								<LinkUITools
									focusAddBlockButton={ focusAddBlockButton }
									focusAddPageButton={ focusAddPageButton }
									setAddingBlock={ () => {
										setAddingBlock( true );
										setFocusAddBlockButton( false );
									} }
									setAddingPage={ () => {
										setAddingPage( true );
										setFocusAddPageButton( false );
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
						setFocusAddBlockButton( true );
						setFocusAddPageButton( false );
					} }
					onBlockInsert={ props?.onBlockInsert }
				/>
			) }

			{ addingPage && (
				<LinkUIPageCreator
					postType={ postType }
					onBack={ () => {
						setAddingPage( false );
						setFocusAddPageButton( true );
						setFocusAddBlockButton( false );
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
	setAddingBlock,
	setAddingPage,
	focusAddBlockButton,
	focusAddPageButton,
	canAddPage,
	canAddBlock,
} ) => {
	const blockInserterAriaRole = 'listbox';
	const addBlockButtonRef = useRef();
	const addPageButtonRef = useRef();

	// Focus the add block button when the popover is opened.
	useEffect( () => {
		if ( focusAddBlockButton ) {
			addBlockButtonRef.current?.focus();
		}
	}, [ focusAddBlockButton ] );

	// Focus the add page button when the popover is opened.
	useEffect( () => {
		if ( focusAddPageButton ) {
			addPageButtonRef.current?.focus();
		}
	}, [ focusAddPageButton ] );

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
