/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	TextControl,
	TextareaControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	getColorClassName,
} from '@wordpress/block-editor';
import { isURL, prependHTTP } from '@wordpress/url';
import { useState, useEffect, useRef } from '@wordpress/element';
import { link as linkIcon, removeSubmenu } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';
import { createBlock } from '@wordpress/blocks';
import { useMergeRefs, usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from './icons';
import { LinkUI } from '../navigation-link/link-ui';
import { updateAttributes } from '../navigation-link/update-attributes';
import {
	getColors,
	getNavigationChildBlockProps,
} from '../navigation/edit/utils';

const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/navigation-submenu',
	'core/page-list',
];

const DEFAULT_BLOCK = {
	name: 'core/navigation-link',
};

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

export default function NavigationSubmenuEdit( {
	attributes,
	isSelected,
	setAttributes,
	mergeBlocks,
	onReplace,
	context,
	clientId,
} ) {
	const { label, url, description, rel, title } = attributes;

	const { showSubmenuIcon, maxNestingLevel, openSubmenusOnClick } = context;

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceBlock,
		selectBlock,
	} = useDispatch( blockEditorStore );
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	// Store what element opened the popover, so we know where to return focus to (toolbar button vs navigation link text)
	const [ openedBy, setOpenedBy ] = useState( null );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add text…' );
	const ref = useRef();

	const {
		parentCount,
		isParentOfSelectedBlock,
		isImmediateParentOfSelectedBlock,
		hasChildren,
		selectedBlockHasChildren,
		onlyDescendantIsEmptyLink,
	} = useSelect(
		( select ) => {
			const {
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
				getBlockParentsByBlockName,
				getBlock,
				getBlockCount,
				getBlockOrder,
			} = select( blockEditorStore );

			let _onlyDescendantIsEmptyLink;

			const selectedBlockId = getSelectedBlockClientId();

			const selectedBlockChildren = getBlockOrder( selectedBlockId );

			// Check for a single descendant in the submenu. If that block
			// is a link block in a "placeholder" state with no label then
			// we can consider as an "empty" link.
			if ( selectedBlockChildren?.length === 1 ) {
				const singleBlock = getBlock( selectedBlockChildren[ 0 ] );

				_onlyDescendantIsEmptyLink =
					singleBlock?.name === 'core/navigation-link' &&
					! singleBlock?.attributes?.label;
			}

			return {
				parentCount: getBlockParentsByBlockName(
					clientId,
					'core/navigation-submenu'
				).length,
				isParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					true
				),
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				hasChildren: !! getBlockCount( clientId ),
				selectedBlockHasChildren: !! selectedBlockChildren?.length,
				onlyDescendantIsEmptyLink: _onlyDescendantIsEmptyLink,
			};
		},
		[ clientId ]
	);

	const prevHasChildren = usePrevious( hasChildren );

	// Show the LinkControl on mount if the URL is empty
	// ( When adding a new menu item)
	// This can't be done in the useState call because it conflicts
	// with the autofocus behavior of the BlockListBlock component.
	useEffect( () => {
		if ( ! openSubmenusOnClick && ! url ) {
			setIsLinkOpen( true );
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

	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
	} = getColors( context, parentCount > 0 );

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			// Required to prevent the command center from opening,
			// as it shares the CMD+K shortcut.
			// See https://github.com/WordPress/gutenberg/pull/59845.
			event.preventDefault();
			// If we don't stop propogation, this event bubbles up to the parent submenu item
			event.stopPropagation();
			setIsLinkOpen( true );
			setOpenedBy( ref.current );
		}
	}

	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor, listItemRef ] ),
		className: clsx( 'wp-block-navigation-item', {
			'is-editing': isSelected || isParentOfSelectedBlock,
			'is-dragging-within': isDraggingWithin,
			'has-link': !! url,
			'has-child': hasChildren,
			'has-text-color': !! textColor || !! customTextColor,
			[ getColorClassName( 'color', textColor ) ]: !! textColor,
			'has-background': !! backgroundColor || customBackgroundColor,
			[ getColorClassName( 'background-color', backgroundColor ) ]:
				!! backgroundColor,
			'open-on-click': openSubmenusOnClick,
		} ),
		style: {
			color: ! textColor && customTextColor,
			backgroundColor: ! backgroundColor && customBackgroundColor,
		},
		onKeyDown,
	} );

	// Always use overlay colors for submenus.
	const innerBlocksColors = getColors( context, true );

	const allowedBlocks =
		parentCount >= maxNestingLevel
			? ALLOWED_BLOCKS.filter(
					( blockName ) => blockName !== 'core/navigation-submenu'
			  )
			: ALLOWED_BLOCKS;

	const navigationChildBlockProps =
		getNavigationChildBlockProps( innerBlocksColors );
	const innerBlocksProps = useInnerBlocksProps( navigationChildBlockProps, {
		allowedBlocks,
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,

		// Ensure block toolbar is not too far removed from item
		// being edited.
		// see: https://github.com/WordPress/gutenberg/pull/34615.
		__experimentalCaptureToolbars: true,

		renderAppender:
			isSelected ||
			( isImmediateParentOfSelectedBlock &&
				! selectedBlockHasChildren ) ||
			// Show the appender while dragging to allow inserting element between item and the appender.
			hasChildren
				? InnerBlocks.ButtonBlockAppender
				: false,
	} );

	const ParentElement = openSubmenusOnClick ? 'button' : 'a';

	function transformToLink() {
		const newLinkBlock = createBlock( 'core/navigation-link', attributes );
		replaceBlock( clientId, newLinkBlock );
	}

	useEffect( () => {
		// If block becomes empty, transform to Navigation Link.
		if ( ! hasChildren && prevHasChildren ) {
			// This side-effect should not create an undo level as those should
			// only be created via user interactions.
			__unstableMarkNextChangeAsNotPersistent();
			transformToLink();
		}
	}, [ hasChildren, prevHasChildren ] );

	const canConvertToLink =
		! selectedBlockHasChildren || onlyDescendantIsEmptyLink;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ ! openSubmenusOnClick && (
						<ToolbarButton
							name="link"
							icon={ linkIcon }
							title={ __( 'Link' ) }
							shortcut={ displayShortcut.primary( 'k' ) }
							onClick={ ( event ) => {
								setIsLinkOpen( true );
								setOpenedBy( event.currentTarget );
							} }
						/>
					) }

					<ToolbarButton
						name="revert"
						icon={ removeSubmenu }
						title={ __( 'Convert to Link' ) }
						onClick={ transformToLink }
						className="wp-block-navigation__submenu__revert"
						disabled={ ! canConvertToLink }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ /* Warning, this duplicated in packages/block-library/src/navigation-link/edit.js */ }
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ label || '' }
						onChange={ ( labelValue ) => {
							setAttributes( { label: labelValue } );
						} }
						label={ __( 'Text' ) }
						autoComplete="off"
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ url || '' }
						onChange={ ( urlValue ) => {
							setAttributes( { url: urlValue } );
						} }
						label={ __( 'Link' ) }
						autoComplete="off"
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						value={ description || '' }
						onChange={ ( descriptionValue ) => {
							setAttributes( {
								description: descriptionValue,
							} );
						} }
						label={ __( 'Description' ) }
						help={ __(
							'The description will be displayed in the menu if the current theme supports it.'
						) }
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ title || '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
						label={ __( 'Title attribute' ) }
						autoComplete="off"
						help={ __(
							'Additional information to help clarify the purpose of the link.'
						) }
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ rel || '' }
						onChange={ ( relValue ) => {
							setAttributes( { rel: relValue } );
						} }
						label={ __( 'Rel attribute' ) }
						autoComplete="off"
						help={ __(
							'The relationship of the linked URL as space-separated link types.'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ /* eslint-disable jsx-a11y/anchor-is-valid */ }
				<ParentElement className="wp-block-navigation-item__content">
					{ /* eslint-enable */ }
					<RichText
						ref={ ref }
						identifier="label"
						className="wp-block-navigation-item__label"
						value={ label }
						onChange={ ( labelValue ) =>
							setAttributes( { label: labelValue } )
						}
						onMerge={ mergeBlocks }
						onReplace={ onReplace }
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
							if ( ! openSubmenusOnClick && ! url ) {
								setIsLinkOpen( true );
								setOpenedBy( ref.current );
							}
						} }
					/>
					{ ! openSubmenusOnClick && isLinkOpen && (
						<LinkUI
							clientId={ clientId }
							link={ attributes }
							onClose={ () => {
								setIsLinkOpen( false );
								if ( openedBy ) {
									openedBy.focus();
									setOpenedBy( null );
								} else {
									selectBlock( clientId );
								}
							} }
							anchor={ popoverAnchor }
							onRemove={ () => {
								setAttributes( { url: '' } );
								speak( __( 'Link removed.' ), 'assertive' );
							} }
							onChange={ ( updatedValue ) => {
								updateAttributes(
									updatedValue,
									setAttributes,
									attributes
								);
							} }
						/>
					) }
				</ParentElement>
				{ ( showSubmenuIcon || openSubmenusOnClick ) && (
					<span className="wp-block-navigation__submenu-icon">
						<ItemSubmenuIcon />
					</span>
				) }
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}
