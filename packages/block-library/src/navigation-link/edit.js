/**
 * External dependencies
 */
import classnames from 'classnames';
import { escape } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, switchToBlockType } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	PanelBody,
	Popover,
	TextControl,
	TextareaControl,
	ToolbarButton,
	Tooltip,
	ToolbarGroup,
	KeyboardShortcuts,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent, ENTER } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	RichText,
	__experimentalLinkControl as LinkControl,
	useBlockProps,
	store as blockEditorStore,
	getColorClassName,
} from '@wordpress/block-editor';
import { isURL, prependHTTP, safeDecodeURI } from '@wordpress/url';
import {
	Fragment,
	useState,
	useEffect,
	useRef,
	createInterpolateElement,
} from '@wordpress/element';
import { placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { link as linkIcon, addSubmenu } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { name } from './block.json';

const MAX_NESTING = 5;

/**
 * A React hook to determine if it's dragging within the target element.
 *
 * @typedef {import('@wordpress/element').RefObject} RefObject
 *
 * @param {RefObject<HTMLElement>} elementRef The target elementRef object.
 *
 * @return {boolean} Is dragging within the target element.
 */
const useIsDraggingWithin = ( elementRef ) => {
	const [ isDraggingWithin, setIsDraggingWithin ] = useState( false );

	useEffect( () => {
		const { ownerDocument } = elementRef.current;

		function handleDragStart( event ) {
			// Check the first time when the dragging starts.
			handleDragEnter( event );
		}

		// Set to false whenever the user cancel the drag event by either releasing the mouse or press Escape.
		function handleDragEnd() {
			setIsDraggingWithin( false );
		}

		function handleDragEnter( event ) {
			// Check if the current target is inside the item element.
			if ( elementRef.current.contains( event.target ) ) {
				setIsDraggingWithin( true );
			} else {
				setIsDraggingWithin( false );
			}
		}

		// Bind these events to the document to catch all drag events.
		// Ideally, we can also use `event.relatedTarget`, but sadly that
		// doesn't work in Safari.
		ownerDocument.addEventListener( 'dragstart', handleDragStart );
		ownerDocument.addEventListener( 'dragend', handleDragEnd );
		ownerDocument.addEventListener( 'dragenter', handleDragEnter );

		return () => {
			ownerDocument.removeEventListener( 'dragstart', handleDragStart );
			ownerDocument.removeEventListener( 'dragend', handleDragEnd );
			ownerDocument.removeEventListener( 'dragenter', handleDragEnter );
		};
	}, [] );

	return isDraggingWithin;
};

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {{ type?: string, subtype?: string }} Search query params.
 */
function getSuggestionsQuery( type, kind ) {
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
			return {};
	}
}

/**
 * Determine the colors for a menu.
 *
 * Order of priority is:
 * 1: Overlay custom colors (if submenu)
 * 2: Overlay theme colors (if submenu)
 * 3: Custom colors
 * 4: Theme colors
 * 5: Global styles
 *
 * @param {Object}  context
 * @param {boolean} isSubMenu
 */
function getColors( context, isSubMenu ) {
	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
		overlayTextColor,
		customOverlayTextColor,
		overlayBackgroundColor,
		customOverlayBackgroundColor,
		style,
	} = context;

	const colors = {};

	if ( isSubMenu && !! customOverlayTextColor ) {
		colors.customTextColor = customOverlayTextColor;
	} else if ( isSubMenu && !! overlayTextColor ) {
		colors.textColor = overlayTextColor;
	} else if ( !! customTextColor ) {
		colors.customTextColor = customTextColor;
	} else if ( !! textColor ) {
		colors.textColor = textColor;
	} else if ( !! style?.color?.text ) {
		colors.customTextColor = style.color.text;
	}

	if ( isSubMenu && !! customOverlayBackgroundColor ) {
		colors.customBackgroundColor = customOverlayBackgroundColor;
	} else if ( isSubMenu && !! overlayBackgroundColor ) {
		colors.backgroundColor = overlayBackgroundColor;
	} else if ( !! customBackgroundColor ) {
		colors.customBackgroundColor = customBackgroundColor;
	} else if ( !! backgroundColor ) {
		colors.backgroundColor = backgroundColor;
	} else if ( !! style?.color?.background ) {
		colors.customTextColor = style.color.background;
	}

	return colors;
}

/**
 * @typedef {'post-type'|'custom'|'taxonomy'|'post-type-archive'} WPNavigationLinkKind
 */

/**
 * Navigation Link Block Attributes
 *
 * @typedef {Object} WPNavigationLinkBlockAttributes
 *
 * @property {string}               [label]         Link text.
 * @property {WPNavigationLinkKind} [kind]          Kind is used to differentiate between term and post ids to check post draft status.
 * @property {string}               [type]          The type such as post, page, tag, category and other custom types.
 * @property {string}               [rel]           The relationship of the linked URL.
 * @property {number}               [id]            A post or term id.
 * @property {boolean}              [opensInNewTab] Sets link target to _blank when true.
 * @property {string}               [url]           Link href.
 * @property {string}               [title]         Link title attribute.
 */

/**
 * Link Control onChange handler that updates block attributes when a setting is changed.
 *
 * @param {Object}                          updatedValue    New block attributes to update.
 * @param {Function}                        setAttributes   Block attribute update function.
 * @param {WPNavigationLinkBlockAttributes} blockAttributes Current block attributes.
 *
 */
export const updateNavigationLinkBlockAttributes = (
	updatedValue = {},
	setAttributes,
	blockAttributes = {}
) => {
	const {
		label: originalLabel = '',
		kind: originalKind = '',
		type: originalType = '',
	} = blockAttributes;

	const {
		title = '', // the title of any provided Post.
		url = '',

		opensInNewTab,
		id,
		kind: newKind = originalKind,
		type: newType = originalType,
	} = updatedValue;
	const normalizedTitle = title.replace( /http(s?):\/\//gi, '' );
	const normalizedURL = url.replace( /http(s?):\/\//gi, '' );
	const escapeTitle =
		title !== '' &&
		normalizedTitle !== normalizedURL &&
		originalLabel !== title;

	const label = escapeTitle
		? escape( title )
		: originalLabel || escape( normalizedURL );

	// In https://github.com/WordPress/gutenberg/pull/24670 we decided to use "tag" in favor of "post_tag"
	const type = newType === 'post_tag' ? 'tag' : newType.replace( '-', '_' );

	const isBuiltInType =
		[ 'post', 'page', 'tag', 'category' ].indexOf( type ) > -1;

	const isCustomLink =
		( ! newKind && ! isBuiltInType ) || newKind === 'custom';
	const kind = isCustomLink ? 'custom' : newKind;

	setAttributes( {
		// Passed `url` may already be encoded. To prevent double encoding, decodeURI is executed to revert to the original string.
		...( url && { url: encodeURI( safeDecodeURI( url ) ) } ),
		...( label && { label } ),
		...( undefined !== opensInNewTab && { opensInNewTab } ),
		...( id && Number.isInteger( id ) && { id } ),
		...( kind && { kind } ),
		...( type && type !== 'URL' && { type } ),
	} );
};

const useIsInvalidLink = ( kind, type, id ) => {
	const isPostType =
		kind === 'post-type' || type === 'post' || type === 'page';
	const hasId = Number.isInteger( id );
	const postStatus = useSelect(
		( select ) => {
			if ( ! isPostType ) {
				return null;
			}
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'postType', type, id )?.status;
		},
		[ isPostType, type, id ]
	);

	// Check Navigation Link validity if:
	// 1. Link is 'post-type'.
	// 2. It has an id.
	// 3. It's neither null, nor undefined, as valid items might be either of those while loading.
	// If those conditions are met, check if
	// 1. The post status is published.
	// 2. The Navigation Link item has no label.
	// If either of those is true, invalidate.
	const isInvalid =
		isPostType && hasId && postStatus && 'trash' === postStatus;
	const isDraft = 'draft' === postStatus;

	return [ isInvalid, isDraft ];
};

const useMissingText = ( type ) => {
	let missingText = '';

	switch ( type ) {
		case 'post':
			/* translators: label for missing post in navigation link block */
			missingText = __( 'Select post' );
			break;
		case 'page':
			/* translators: label for missing page in navigation link block */
			missingText = __( 'Select page' );
			break;
		case 'category':
			/* translators: label for missing category in navigation link block */
			missingText = __( 'Select category' );
			break;
		case 'tag':
			/* translators: label for missing tag in navigation link block */
			missingText = __( 'Select tag' );
			break;
		default:
			/* translators: label for missing values in navigation link block */
			missingText = __( 'Add link' );
	}

	return { missingText };
};

/**
 * Removes HTML from a given string.
 * Note the does not provide XSS protection or otherwise attempt
 * to filter strings with malicious intent.
 *
 * See also: https://github.com/WordPress/gutenberg/pull/35539
 *
 * @param {string} html the string from which HTML should be removed.
 * @return {string} the "cleaned" string.
 */
function navStripHTML( html ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;
	return doc.body.textContent || '';
}

/**
 * Add transforms to Link Control
 */

function LinkControlTransforms( { block, transforms, replace } ) {
	if ( ! transforms?.length ) {
		return null;
	}

	return (
		<div className="link-control-transform">
			<h3 className="link-control-transform__subheading">
				{ __( 'Transform' ) }
			</h3>
			<div className="link-control-transform__items">
				{ transforms.map( ( item, index ) => {
					return (
						<Button
							key={ `transform-${ index }` }
							onClick={ () =>
								replace(
									block.clientId,
									switchToBlockType( block, item.name )
								)
							}
							className="link-control-transform__item"
						>
							<BlockIcon icon={ item.icon } />
							{ item.title }
						</Button>
					);
				} ) }
			</div>
		</div>
	);
}

export default function NavigationLinkEdit( {
	attributes,
	isSelected,
	setAttributes,
	insertBlocksAfter,
	mergeBlocks,
	onReplace,
	context,
	clientId,
} ) {
	const {
		id,
		label,
		type,
		opensInNewTab,
		url,
		description,
		rel,
		title,
		kind,
	} = attributes;

	const [ isInvalid, isDraft ] = useIsInvalidLink( kind, type, id );

	const link = {
		url,
		opensInNewTab,
		title: label && navStripHTML( label ), // don't allow HTML to display inside the <LinkControl>
	};
	const { saveEntityRecord } = useDispatch( coreStore );
	const {
		replaceBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add link…' );
	const ref = useRef();

	const {
		innerBlocks,
		isAtMaxNesting,
		isTopLevelLink,
		isParentOfSelectedBlock,
		hasDescendants,
		userCanCreatePages,
		userCanCreatePosts,
		thisBlock,
		blockTransforms,
	} = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlocks,
				getBlockName,
				getBlockRootClientId,
				getClientIdsOfDescendants,
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
				getBlockParentsByBlockName,
				getBlockTransformItems,
			} = select( blockEditorStore );

			const selectedBlockId = getSelectedBlockClientId();

			const descendants = getClientIdsOfDescendants( [ clientId ] )
				.length;

			return {
				innerBlocks: getBlocks( clientId ),
				isAtMaxNesting:
					getBlockParentsByBlockName( clientId, [
						name,
						'core/navigation-submenu',
					] ).length >= MAX_NESTING,
				isTopLevelLink:
					getBlockName( getBlockRootClientId( clientId ) ) ===
					'core/navigation',
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				hasDescendants: !! descendants,
				selectedBlockHasDescendants: !! getClientIdsOfDescendants( [
					selectedBlockId,
				] )?.length,
				userCanCreatePages: select( coreStore ).canUser(
					'create',
					'pages'
				),
				userCanCreatePosts: select( coreStore ).canUser(
					'create',
					'posts'
				),
				thisBlock: getBlock( clientId ),
				blockTransforms: getBlockTransformItems(
					[ getBlock( clientId ) ],
					getBlockRootClientId( clientId )
				),
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		// This side-effect should not create an undo level as those should
		// only be created via user interactions. Mark this change as
		// not persistent to avoid undo level creation.
		// See https://github.com/WordPress/gutenberg/issues/34564.
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { isTopLevelLink } );
	}, [ isTopLevelLink ] );

	/**
	 * Transform to submenu block.
	 */
	function transformToSubmenu() {
		const newSubmenu = createBlock(
			'core/navigation-submenu',
			attributes,
			innerBlocks
		);
		replaceBlock( clientId, newSubmenu );
	}

	const featuredBlocks = [
		'core/site-logo',
		'core/social-links',
		'core/search',
	];
	const featuredTransforms = blockTransforms.filter( ( item ) => {
		return featuredBlocks.includes( item.name );
	} );

	useEffect( () => {
		// Show the LinkControl on mount if the URL is empty
		// ( When adding a new menu item)
		// This can't be done in the useState call because it conflicts
		// with the autofocus behavior of the BlockListBlock component.
		if ( ! url ) {
			setIsLinkOpen( true );
		}
		// If block has inner blocks, transform to Submenu.
		if ( hasDescendants ) {
			transformToSubmenu();
		}
	}, [] );

	/**
	 * The hook shouldn't be necessary but due to a focus loss happening
	 * when selecting a suggestion in the link popover, we force close on block unselection.
	 */
	useEffect( () => {
		if ( ! isSelected ) {
			setIsLinkOpen( false );
		}
	}, [ isSelected ] );

	// If the LinkControl popover is open and the URL has changed, close the LinkControl and focus the label text.
	useEffect( () => {
		if ( isLinkOpen && url ) {
			// Does this look like a URL and have something TLD-ish?
			if (
				isURL( prependHTTP( label ) ) &&
				/^.+\.[a-z]+/.test( label )
			) {
				// Focus and select the label text.
				selectLabelText();
			} else {
				// Focus it (but do not select).
				placeCaretAtHorizontalEdge( ref.current, true );
			}
		}
	}, [ url ] );

	/**
	 * Focus the Link label text and select it.
	 */
	function selectLabelText() {
		ref.current.focus();
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;
		const selection = defaultView.getSelection();
		const range = ownerDocument.createRange();
		// Get the range of the current ref contents so we can add this range to the selection.
		range.selectNodeContents( ref.current );
		selection.removeAllRanges();
		selection.addRange( range );
	}

	/**
	 * Removes the current link if set.
	 */
	function removeLink() {
		// Reset all attributes that comprise the link.
		setAttributes( {
			url: '',
			label: '',
			id: '',
			kind: '',
			type: '',
		} );

		// Close the link editing UI.
		setIsLinkOpen( false );
	}

	let userCanCreate = false;
	if ( ! type || type === 'page' ) {
		userCanCreate = userCanCreatePages;
	} else if ( type === 'post' ) {
		userCanCreate = userCanCreatePosts;
	}

	async function handleCreate( pageTitle ) {
		const postType = type || 'page';

		const page = await saveEntityRecord( 'postType', postType, {
			title: pageTitle,
			status: 'draft',
		} );

		return {
			id: page.id,
			type: postType,
			title: page.title.rendered,
			url: page.link,
			kind: 'post-type',
		};
	}

	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
	} = getColors( context, ! isTopLevelLink );

	function onKeyDown( event ) {
		if (
			isKeyboardEvent.primary( event, 'k' ) ||
			( ! url && event.keyCode === ENTER )
		) {
			setIsLinkOpen( true );
		}
	}

	const blockProps = useBlockProps( {
		ref: listItemRef,
		className: classnames( 'wp-block-navigation-item', {
			'is-editing': isSelected || isParentOfSelectedBlock,
			'is-dragging-within': isDraggingWithin,
			'has-link': !! url,
			'has-child': hasDescendants,
			'has-text-color': !! textColor || !! customTextColor,
			[ getColorClassName( 'color', textColor ) ]: !! textColor,
			'has-background': !! backgroundColor || customBackgroundColor,
			[ getColorClassName(
				'background-color',
				backgroundColor
			) ]: !! backgroundColor,
		} ),
		style: {
			color: ! textColor && customTextColor,
			backgroundColor: ! backgroundColor && customBackgroundColor,
		},
		onKeyDown,
	} );

	if ( ! url || isInvalid || isDraft ) {
		blockProps.onClick = () => setIsLinkOpen( true );
	}

	const classes = classnames( 'wp-block-navigation-item__content', {
		'wp-block-navigation-link__placeholder': ! url || isInvalid || isDraft,
	} );

	const missingText = useMissingText( type, isInvalid, isDraft );
	/* translators: Whether the navigation link is Invalid or a Draft. */
	const placeholderText = `(${
		isInvalid ? __( 'Invalid' ) : __( 'Draft' )
	})`;

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						name="link"
						icon={ linkIcon }
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ () => setIsLinkOpen( true ) }
					/>
					{ ! isAtMaxNesting && (
						<ToolbarButton
							name="submenu"
							icon={ addSubmenu }
							title={ __( 'Add submenu' ) }
							onClick={ transformToSubmenu }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<TextareaControl
						value={ description || '' }
						onChange={ ( descriptionValue ) => {
							setAttributes( { description: descriptionValue } );
						} }
						label={ __( 'Description' ) }
						help={ __(
							'The description will be displayed in the menu if the current theme supports it.'
						) }
					/>
					<TextControl
						value={ title || '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
						label={ __( 'Link title' ) }
						autoComplete="off"
					/>
					<TextControl
						value={ rel || '' }
						onChange={ ( relValue ) => {
							setAttributes( { rel: relValue } );
						} }
						label={ __( 'Link rel' ) }
						autoComplete="off"
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ /* eslint-disable jsx-a11y/anchor-is-valid */ }
				<a className={ classes }>
					{ /* eslint-enable */ }
					{ ! url ? (
						<div className="wp-block-navigation-link__placeholder-text">
							<Tooltip
								position="top center"
								text={ __( 'This item is missing a link' ) }
							>
								<span>{ missingText }</span>
							</Tooltip>
						</div>
					) : (
						<>
							{ ! isInvalid && ! isDraft && (
								<RichText
									ref={ ref }
									identifier="label"
									className="wp-block-navigation-item__label"
									value={ label }
									onChange={ ( labelValue ) =>
										setAttributes( {
											label: labelValue,
										} )
									}
									onMerge={ mergeBlocks }
									onReplace={ onReplace }
									__unstableOnSplitAtEnd={ () =>
										insertBlocksAfter(
											createBlock(
												'core/navigation-link'
											)
										)
									}
									aria-label={ __( 'Navigation link text' ) }
									placeholder={ itemLabelPlaceholder }
									withoutInteractiveFormatting
									allowedFormats={ [
										'core/bold',
										'core/italic',
										'core/image',
										'core/strikethrough',
									] }
									onClick={ () => {
										if ( ! url ) {
											setIsLinkOpen( true );
										}
									} }
								/>
							) }
							{ ( isInvalid || isDraft ) && (
								<div className="wp-block-navigation-link__placeholder-text wp-block-navigation-link__label">
									<KeyboardShortcuts
										shortcuts={ {
											enter: () =>
												isSelected &&
												setIsLinkOpen( true ),
										} }
									/>
									<Tooltip
										position="top center"
										text={ __(
											'This item has been deleted, or is a draft'
										) }
									>
										<span>
											{
												/* Trim to avoid trailing white space when the placeholder text is not present */
												`${ label } ${ placeholderText }`.trim()
											}
										</span>
									</Tooltip>
								</div>
							) }
						</>
					) }
					{ isLinkOpen && (
						<Popover
							position="bottom center"
							onClose={ () => setIsLinkOpen( false ) }
							anchorRef={ listItemRef.current }
						>
							<LinkControl
								hasTextControl
								hasRichPreviews
								className="wp-block-navigation-link__inline-link-input"
								value={ link }
								showInitialSuggestions={ true }
								withCreateSuggestion={ userCanCreate }
								createSuggestion={ handleCreate }
								createSuggestionButtonText={ ( searchTerm ) => {
									let format;
									if ( type === 'post' ) {
										/* translators: %s: search term. */
										format = __(
											'Create draft post: <mark>%s</mark>'
										);
									} else {
										/* translators: %s: search term. */
										format = __(
											'Create draft page: <mark>%s</mark>'
										);
									}
									return createInterpolateElement(
										sprintf( format, searchTerm ),
										{ mark: <mark /> }
									);
								} }
								noDirectEntry={ !! type }
								noURLSuggestion={ !! type }
								suggestionsQuery={ getSuggestionsQuery(
									type,
									kind
								) }
								onChange={ ( updatedValue ) =>
									updateNavigationLinkBlockAttributes(
										updatedValue,
										setAttributes,
										attributes
									)
								}
								onRemove={ removeLink }
								renderControlBottom={
									! url
										? () => (
												<LinkControlTransforms
													block={ thisBlock }
													transforms={
														featuredTransforms
													}
													replace={ replaceBlock }
												/>
										  )
										: null
								}
							/>
						</Popover>
					) }
				</a>
			</div>
		</Fragment>
	);
}
