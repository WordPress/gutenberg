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

export default function BlockContentOverlay( { clientId, children } ) {
	const baseClassName = 'block-editor-block-content-overlay';
	const [ isOverlayActive, setIsOverlayActive ] = useState( true );
	const [ isHovered, setIsHovered ] = useState( false );

	const {
		isSelected,
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
				isSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId, true ),
				isDraggingBlocks: _isDraggingBlocks(),
				isParentHighlighted: isBlockHighlighted( clientId ),
			};
		},
		[ clientId ]
	);

	const classes = classnames( baseClassName, {
		'overlay-active': isOverlayActive,
		'parent-highlighted': isParentHighlighted,
		'child-selected': hasChildSelected,
		'is-dragging-blocks': isDraggingBlocks,
	} );

	useEffect( () => {
		if ( ! isSelected && ! hasChildSelected && ! isOverlayActive ) {
			setIsOverlayActive( true );
		}
		// If selected by another source (list view, etc.) dismiss the overlay.
		if ( isSelected && ! isHovered && isOverlayActive ) {
			setIsOverlayActive( false );
		}
	}, [ isSelected, hasChildSelected, isOverlayActive, isHovered ] );

	// Disabled because the overlay div doesn't actually have a role or functionality
	// as far as the user is concerned. We're just catching the first click so that
	// the block can be selected without interacting with its contents.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			className={ classes }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
		>
			{ ( ( isOverlayActive && ! hasChildSelected ) ||
				isDraggingBlocks ) && (
				<div
					className={ `${ baseClassName }__overlay` }
					onMouseUp={ () => setIsOverlayActive( false ) }
				/>
			) }
			<div className={ `${ baseClassName }__content-wrapper` }>
				{ children }
			</div>
		</div>
	);
}
/* eslint-enable jsx-a11y/no-static-element-interactions */
