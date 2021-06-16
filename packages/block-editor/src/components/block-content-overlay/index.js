/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * External dependencies
 */
import classnames from 'classnames';

export default function BlockContentOverlay( {
	clientId,
	tagName: TagName = 'div',
	wrapperProps,
	className,
} ) {
	const baseClassName = 'block-editor-block-content-overlay';
	const [ isOverlayActive, setIsOverlayActive ] = useState( true );
	const [ isHovered, setIsHovered ] = useState( false );

	const {
		isParentSelected,
		hasChildSelected,
		isDraggingBlocks,
		isParentHighlighted,
	} = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				isDraggingBlocks: _isDraggingBlocks,
				isBlockHighlighted,
			} = select( blockEditorStore );
			return {
				isParentSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId, true ),
				isDraggingBlocks: _isDraggingBlocks(),
				isParentHighlighted: isBlockHighlighted( clientId ),
			};
		},
		[ clientId ]
	);

	const classes = classnames(
		baseClassName,
		wrapperProps?.className,
		className,
		{
			'overlay-active': isOverlayActive,
			'parent-highlighted': isParentHighlighted,
			'is-dragging-blocks': isDraggingBlocks,
		}
	);

	useEffect( () => {
		// Reenable when blocks are not in use.
		if ( ! isParentSelected && ! hasChildSelected && ! isOverlayActive ) {
			setIsOverlayActive( true );
		}
		// Disable if parent selected by another means (such as list view).
		// We check hover to ensure the overlay click interaction is not taking place.
		// Trying to click the overlay will select the parent block via its 'focusin'
		// listener on the wrapper, so if the block is selected while hovered we will
		// let the mouseup disable the overlay instead.
		if ( isParentSelected && ! isHovered && isOverlayActive ) {
			setIsOverlayActive( false );
		}
		// Ensure overlay is disabled if a child block is selected.
		if ( hasChildSelected && isOverlayActive ) {
			setIsOverlayActive( false );
		}
	}, [ isParentSelected, hasChildSelected, isOverlayActive, isHovered ] );

	// Disabled because the overlay div doesn't actually have a role or functionality
	// as far as the a11y is concerned. We're just catching the first click so that
	// the block can be selected without interacting with its contents.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<TagName
			{ ...wrapperProps }
			className={ classes }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
		>
			{ isOverlayActive && (
				<div
					className={ `${ baseClassName }__overlay` }
					onMouseUp={ () => setIsOverlayActive( false ) }
				/>
			) }
			{ wrapperProps?.children }
		</TagName>
	);
}
/* eslint-enable jsx-a11y/no-static-element-interactions */
