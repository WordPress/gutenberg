/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	TextControl,
	TextareaControl,
	ToolbarButton,
	Tooltip,
	ToolbarGroup,
} from '@wordpress/components';
import { displayShortcut, isKeyboardEvent, ENTER } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	getColorClassName,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { isURL, prependHTTP } from '@wordpress/url';
import { useState, useEffect, useRef } from '@wordpress/element';
import {
	placeCaretAtHorizontalEdge,
	__unstableStripHTML as stripHTML,
} from '@wordpress/dom';
import { decodeEntities } from '@wordpress/html-entities';
import { link as linkIcon, addSubmenu } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { name } from './block.json';
import { LinkUI } from './link-ui';
import { updateAttributes } from './update-attributes';
import { getColors } from '../navigation/edit/utils';

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
	const { id, label, type, url, description, rel, title, kind } = attributes;

	const [ isInvalid, isDraft ] = useIsInvalidLink( kind, type, id );
	const { maxNestingLevel } = context;

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
			// This side-effect should not create an undo level as those should
			// only be created via user interactions.
			__unstableMarkNextChangeAsNotPersistent();
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
		// It is critical that all attributes are reset
		// to their default values otherwise this may
		// in advertently trigger side effects because
		// the values will have "changed".
		setAttributes( {
			url: undefined,
			label: undefined,
			id: undefined,
			kind: undefined,
			type: undefined,
			opensInNewTab: false,
		} );

		// Close the link editing UI.
		setIsLinkOpen( false );
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
			( ( ! url || isDraft || isInvalid ) && event.keyCode === ENTER )
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
		'core/page-list',
	];
	const DEFAULT_BLOCK = {
		name: 'core/navigation-link',
	};

	const innerBlocksProps = useInnerBlocksProps(
		{
			...blockProps,
			className: 'remove-outline', // Remove the outline from the inner blocks container.
		},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			__experimentalDefaultBlock: DEFAULT_BLOCK,
			__experimentalDirectInsert: true,
			renderAppender: false,
		}
	);

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
		<>
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
				<PanelBody title={ __( 'Settings' ) }>
					<TextControl
						__nextHasNoMarginBottom
						value={ label ? stripHTML( label ) : '' }
						onChange={ ( labelValue ) => {
							setAttributes( { label: labelValue } );
						} }
						label={ __( 'Label' ) }
						autoComplete="off"
					/>
					<TextControl
						__nextHasNoMarginBottom
						value={ url || '' }
						onChange={ ( urlValue ) => {
							updateAttributes(
								{ url: urlValue },
								setAttributes,
								attributes
							);
						} }
						label={ __( 'URL' ) }
						autoComplete="off"
					/>
					<TextareaControl
						__nextHasNoMarginBottom
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
						__nextHasNoMarginBottom
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
													`${ decodeEntities(
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
							className="wp-block-navigation-link__inline-link-input"
							clientId={ clientId }
							link={ attributes }
							onClose={ () => setIsLinkOpen( false ) }
							anchor={ popoverAnchor }
							onRemove={ removeLink }
							onChange={ ( updatedValue ) => {
								updateAttributes(
									updatedValue,
									setAttributes,
									attributes
								);
							} }
						/>
					) }
				</a>
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}
