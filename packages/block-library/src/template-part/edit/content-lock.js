/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import classnames from 'classnames';

const baseClassName = 'wp-block-template-part__content-lock';

export default function ContentLock( { clientId, children } ) {
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
					className={ `${ baseClassName }-overlay` }
					onMouseUp={ () => selectBlock( clientId ) }
				/>
			) }
			<div className={ `${ baseClassName }-content-wrapper` }>
				{ children }
			</div>
		</div>
	);
}
/* eslint-enable jsx-a11y/no-static-element-interactions */
