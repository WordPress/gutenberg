/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	RichText,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Fragment, useState, useEffect, useRef } from '@wordpress/element';

import { addSubmenu } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from '../navigation-link/icons';

const ALLOWED_BLOCKS = [ 'core/navigation-link' ];

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

export default function NavigationHeadingEdit( {
	attributes,
	isSelected,
	setAttributes,
	insertBlocksAfter,
	mergeBlocks,
	onReplace,
	context,
	clientId,
} ) {
	const { label } = attributes;

	const { textColor, backgroundColor, style, showSubmenuIcon } = context;
	const { insertBlock } = useDispatch( blockEditorStore );
	const listItemRef = useRef( null );
	const isDraggingWithin = useIsDraggingWithin( listItemRef );
	const itemLabelPlaceholder = __( 'Add link…' );
	const ref = useRef();

	const {
		isParentOfSelectedBlock,
		isImmediateParentOfSelectedBlock,
		hasDescendants,
		selectedBlockHasDescendants,
		numberOfDescendants,
	} = useSelect(
		( select ) => {
			const {
				getClientIdsOfDescendants,
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
			} = select( blockEditorStore );

			const selectedBlockId = getSelectedBlockClientId();

			const descendants = getClientIdsOfDescendants( [ clientId ] )
				.length;

			return {
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				hasDescendants: !! descendants,
				selectedBlockHasDescendants: !! getClientIdsOfDescendants( [
					selectedBlockId,
				] )?.length,
				numberOfDescendants: descendants,
			};
		},
		[ clientId ]
	);

	/**
	 * Insert a link block when submenu is added.
	 */
	function insertLinkBlock() {
		const insertionPoint = numberOfDescendants;
		const blockToInsert = createBlock( 'core/navigation-link' );
		insertBlock( blockToInsert, insertionPoint, clientId );
	}

	const blockProps = useBlockProps( {
		ref: listItemRef,
		className: classnames( {
			'is-editing': isSelected || isParentOfSelectedBlock,
			'is-dragging-within': isDraggingWithin,
			'has-child': hasDescendants,
			'has-text-color': !! textColor || !! style?.color?.text,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor || !! style?.color?.background,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
		} ),
		style: {
			color: style?.color?.text,
			backgroundColor: style?.color?.background,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: classnames( 'wp-block-navigation-link__container', {
				'is-parent-of-selected-block': isParentOfSelectedBlock,
			} ),
		},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			renderAppender:
				( isSelected && hasDescendants ) ||
				( isImmediateParentOfSelectedBlock &&
					! selectedBlockHasDescendants ) ||
				// Show the appender while dragging to allow inserting element between item and the appender.
				hasDescendants
					? InnerBlocks.DefaultAppender
					: false,
		}
	);

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						name="submenu"
						icon={ addSubmenu }
						title={ __( 'Add submenu' ) }
						onClick={ insertLinkBlock }
					/>
				</ToolbarGroup>
			</BlockControls>
			<div { ...blockProps }>
				{ /* eslint-disable jsx-a11y/anchor-is-valid */ }
				<span className="wp-block-navigation-link__content">
					{ /* eslint-enable */ }
					<RichText
						ref={ ref }
						identifier="label"
						className="wp-block-navigation-link__label"
						value={ label }
						onChange={ ( labelValue ) =>
							setAttributes( { label: labelValue } )
						}
						onMerge={ mergeBlocks }
						onReplace={ onReplace }
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( 'core/navigation-link' )
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
					/>

					{ hasDescendants && showSubmenuIcon && (
						<span className="wp-block-navigation-link__submenu-icon">
							<ItemSubmenuIcon />
						</span>
					) }
				</span>
				<div { ...innerBlocksProps } />
			</div>
		</Fragment>
	);
}
