/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';

function BlockDraggable( { rootUID, index, uid, layout, isDragging, ...props } ) {
	const blockDragInsetClassName = classnames( 'editor-block-list__block-draggable', {
		'is-visible': isDragging,
	} );

	const transferData = {
		type: 'block',
		rootUID: rootUID,
		fromIndex: index,
		uid: uid,
		layout,
	};

	return (
		<Draggable className={ blockDragInsetClassName } transferData={ transferData } { ...props }>
			<div className="inner" ></div>
		</Draggable>
	);
}

export default BlockDraggable;
