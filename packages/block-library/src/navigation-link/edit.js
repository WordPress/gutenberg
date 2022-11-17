/**
 * External dependencies
 */
import classnames from 'classnames';
import escapeHtml from 'escape-html';
import { unescape } from 'lodash';

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
import {
	store as coreStore,
	useResourcePermissions,
} from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { name } from './block.json';

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
		title: newLabel = '', // the title of any provided Post.
		url: newUrl = '',

		opensInNewTab,
		id,
		kind: newKind = originalKind,
		type: newType = originalType,
	} = updatedValue;

	const newLabelWithoutHttp = newLabel.replace( /http(s?):\/\//gi, '' );
	const newUrlWithoutHttp = newUrl.replace( /http(s?):\/\//gi, '' );

	const useNewLabel =
		newLabel &&
		newLabel !== originalLabel &&
		// LinkControl without the title field relies
		// on the check below. Specifically, it assumes that
		// the URL is the same as a title.
		// This logic a) looks suspicious and b) should really
		// live in the LinkControl and not here. It's a great
		// candidate for future refactoring.
		newLabelWithoutHttp !== newUrlWithoutHttp;

	// Unfortunately this causes the escaping model to be inverted.
	// The escaped content is stored in the block attributes (and ultimately in the database),
	// and then the raw data is "recovered" when outputting into the DOM.
	// It would be preferable to store the **raw** data in the block attributes and escape it in JS.
	// Why? Because there isn't one way to escape data. Depending on the context, you need to do
	// different transforms. It doesn't make sense to me to choose one of them for the purposes of storage.
	// See also:
	// - https://github.com/WordPress/gutenberg/pull/41063
	// - https://github.com/WordPress/gutenberg/pull/18617.
	const label = useNewLabel
		? escapeHtml( newLabel )
		: originalLabel || escapeHtml( newUrlWithoutHttp );

	// In https://github.com/WordPress/gutenberg/pull/24670 we decided to use "tag" in favor of "post_tag"
	const type = newType === 'post_tag' ? 'tag' : newType.replace( '-', '_' );

	const isBuiltInType =
		[ 'post', 'page', 'tag', 'category' ].indexOf( type ) > -1;

	const isCustomLink =
		( ! newKind && ! isBuiltInType ) || newKind === 'custom';
	const kind = isCustomLink ? 'custom' : newKind;

	setAttributes( {
		// Passed `url` may already be encoded. To prevent double encoding, decodeURI is executed to revert to the original string.
		...( newUrl && { url: encodeURI( safeDecodeURI( newUrl ) ) } ),
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

function getMissingText( type ) {
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

	return missingText;
}

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

function LinkControlTransforms( { clientId, replace } ) {
	const { getBlock, blockTransforms } = useSelect(
		( select ) => {
			const {
				getBlock: _getBlock,
				getBlockRootClientId,
				getBlockTransformItems,
			} = select( blockEditorStore );

			return {
				getBlock: _getBlock,
				blockTransforms: getBlockTransformItems(
					_getBlock( clientId ),
					getBlockRootClientId( clientId )
				),
			};
		},
		[ clientId ]
	);

	const featuredBlocks = [
		'core/site-logo',
		'core/social-links',
		'core/search',
	];
	const transforms = blockTransforms.filter( ( item ) => {
		return featuredBlocks.includes( item.name );
	} );

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
									clientId,
									switchToBlockType(
										getBlock( clientId ),
										item.name
									)
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
	const { maxNestingLevel } = context;

	const link = {
		url,
		opensInNewTab,
		title: label && navStripHTML( label ), // don't allow HTML to display inside the <LinkControl>
	};
	const { saveEntityRecord } = useDispatch( coreStore );
	const { replaceBlock, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add label…' );
	const ref = useRef();

	const pagesPermissions = useResourcePermissions( 'pages' );
	const postsPermissions = useResourcePermissions( 'posts' );

	const {
		innerBlocks,
		isAtMaxNesting,
		isTopLevelLink,
		isParentOfSelectedBlock,
		hasChildren,
	} = useSelect(
		( select ) => {
			const {
				getBlocks,
				getBlockCount,
				getBlockName,
				getBlockRootClientId,
				hasSelectedInnerBlock,
				getBlockParentsByBlockName,
			} = select( blockEditorStore );

			return {
				innerBlocks: getBlocks( clientId ),
				isAtMaxNesting:
					getBlockParentsByBlockName( clientId, [
						name,
						'core/navigation-submenu',
					] ).length >= maxNestingLevel,
				isTopLevelLink:
					getBlockName( getBlockRootClientId( clientId ) ) ===
					'core/navigation',
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				hasChildren: !! getBlockCount( clientId ),
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

	useEffect( () => {
		// Show the LinkControl on mount if the URL is empty
		// ( When adding a new menu item)
		// This can't be done in the useState call because it conflicts
		// with the autofocus behavior of the BlockListBlock component.
		if ( ! url ) {
			setIsLinkOpen( true );
		}
		// If block has inner blocks, transform to Submenu.
		if ( hasChildren ) {
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
		userCanCreate = pagesPermissions.canCreate;
	} else if ( type === 'post' ) {
		userCanCreate = postsPermissions.canCreate;
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
			// Make `title` property consistent with that in `fetchLinkSuggestions` where the `rendered` title (containing HTML entities)
			// is also being decoded. By being consistent in both locations we avoid having to branch in the rendering output code.
			// Ideally in the future we will update both APIs to utilise the "raw" form of the title which is better suited to edit contexts.
			// e.g.
			// - title.raw = "Yes & No"
			// - title.rendered = "Yes &#038; No"
			// - decodeEntities( title.rendered ) = "Yes & No"
			// See:
			// - https://github.com/WordPress/gutenberg/pull/41063
			// - https://github.com/WordPress/gutenberg/blob/a1e1fdc0e6278457e9f4fc0b31ac6d2095f5450b/packages/core-data/src/fetch/__experimental-fetch-link-suggestions.js#L212-L218
			title: decodeEntities( page.title.rendered ),
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
		ref: useMergeRefs( [ setPopoverAnchor, listItemRef ] ),
		className: classnames( 'wp-block-navigation-item', {
			'is-editing': isSelected || isParentOfSelectedBlock,
			'is-dragging-within': isDraggingWithin,
			'has-link': !! url,
			'has-child': hasChildren,
			'has-text-color': !! textColor || !! customTextColor,
			[ getColorClassName( 'color', textColor ) ]: !! textColor,
			'has-background': !! backgroundColor || customBackgroundColor,
			[ getColorClassName( 'background-color', backgroundColor ) ]:
				!! backgroundColor,
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

	const missingText = getMissingText( type );
	/* translators: Whether the navigation link is Invalid or a Draft. */
	const placeholderText = `(${
		isInvalid ? __( 'Invalid' ) : __( 'Draft' )
	})`;
	const tooltipText =
		isInvalid || isDraft
			? __( 'This item has been deleted, or is a draft' )
			: __( 'This item is missing a link' );

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
					<TextControl
						value={ url || '' }
						onChange={ ( urlValue ) => {
							setAttributes( { url: urlValue } );
						} }
						label={ __( 'URL' ) }
						autoComplete="off"
					/>
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
							<Tooltip position="top center" text={ tooltipText }>
								<>
									<span>{ missingText }</span>
									<span className="wp-block-navigation-link__missing_text-tooltip">
										{ tooltipText }
									</span>
								</>
							</Tooltip>
						</div>
					) : (
						<>
							{ ! isInvalid && ! isDraft && (
								<>
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
										aria-label={ __(
											'Navigation link text'
										) }
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
									{ description && (
										<span className="wp-block-navigation-item__description">
											{ description }
										</span>
									) }
								</>
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
										text={ tooltipText }
									>
										<>
											<span
												aria-label={ __(
													'Navigation link text'
												) }
											>
												{
													// Some attributes are stored in an escaped form. It's a legacy issue.
													// Ideally they would be stored in a raw, unescaped form.
													// Unescape is used here to "recover" the escaped characters
													// so they display without encoding.
													// See `updateNavigationLinkBlockAttributes` for more details.
													`${ unescape(
														label
													) } ${ placeholderText }`.trim()
												}
											</span>
											<span className="wp-block-navigation-link__missing_text-tooltip">
												{ tooltipText }
											</span>
										</>
									</Tooltip>
								</div>
							) }
						</>
					) }
					{ isLinkOpen && (
						<Popover
							placement="bottom"
							onClose={ () => setIsLinkOpen( false ) }
							anchor={ popoverAnchor }
							shift
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
													clientId={ clientId }
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
