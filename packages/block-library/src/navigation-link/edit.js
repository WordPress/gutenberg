/**
 * External dependencies
 */
import classnames from 'classnames';
import { unescape } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, switchToBlockType } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	PanelBody,
	TextControl,
	TextareaControl,
	ToolbarButton,
	Tooltip,
	ToolbarGroup,
	KeyboardShortcuts,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent, ENTER } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	getColorClassName,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { isURL, prependHTTP } from '@wordpress/url';
import { Fragment, useState, useEffect, useRef } from '@wordpress/element';
import { placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { link as linkIcon, addSubmenu } from '@wordpress/icons';
import {
	store as coreStore,
	useResourcePermissions,
} from '@wordpress/core-data';

import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { name } from './block.json';
import { LinkUI } from './link-ui';

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

export function LinkControlTransforms( { clientId } ) {
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

	const { replaceBlock } = useDispatch( blockEditorStore );

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
								replaceBlock(
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
			innerBlocks.length > 0
				? innerBlocks
				: [ createBlock( 'core/navigation-link' ) ]
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
	}, [ url ] );

	useEffect( () => {
		// If block has inner blocks, transform to Submenu.
		if ( hasChildren ) {
			transformToSubmenu();
		}
	}, [ hasChildren ] );

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

	const ALLOWED_BLOCKS = [
		'core/navigation-link',
		'core/navigation-submenu',
	];
	const DEFAULT_BLOCK = {
		name: 'core/navigation-link',
	};
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		__experimentalDefaultBlock: DEFAULT_BLOCK,
		__experimentalDirectInsert: true,
		renderAppender: false,
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
			{ /* Warning, this duplicated in packages/block-library/src/navigation-submenu/edit.js */ }
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<TextControl
						value={ label || '' }
						onChange={ ( labelValue ) => {
							setAttributes( { label: labelValue } );
						} }
						label={ __( 'Label' ) }
						autoComplete="off"
					/>
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
													// See `updateAttributes` for more details.
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
						<LinkUI
							attributes={ attributes }
							setAttributes={ setAttributes }
							clientId={ clientId }
							type={ type }
							url={ url }
							kind={ kind }
							linkValue={ link }
							onClose={ () => setIsLinkOpen( false ) }
							anchor={ popoverAnchor }
							hasCreateSuggestion={ userCanCreate }
							onRemove={ removeLink }
						/>
					) }
				</a>
				<div { ...innerBlocksProps } />
			</div>
		</Fragment>
	);
}
