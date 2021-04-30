/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

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
	const { isSelected, hasChildSelected, isDraggingBlocks } = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				isDraggingBlocks: _isDraggingBlocks,
			} = select( blockEditorStore );
			return {
				isSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId, true ),
				isDraggingBlocks: _isDraggingBlocks(),
			};
		},
		[ clientId ]
	);
	const selectBlock = useDispatch( blockEditorStore ).selectBlock;

	const classes = classnames( baseClassName, {
		'parent-selected': isSelected,
		'child-selected': hasChildSelected,
		'is-dragging-blocks': isDraggingBlocks,
	} );

	// Disabled because the overlay div doesn't actually have a role or functionality
	// as far as the user is concerned. We're just catching the first click so that
	// the block can be selected without interacting with its contents.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div className={ classes }>
			{ ( ( ! isSelected && ! hasChildSelected ) ||
				isDraggingBlocks ) && (
				<div
					className={ `${ baseClassName }__overlay` }
					onMouseUp={ () => selectBlock( clientId ) }
				/>
			) }
			<div className={ `${ baseClassName }__content-wrapper` }>
				{ children }
			</div>
		</div>
	);
}
/* eslint-enable jsx-a11y/no-static-element-interactions */
