/**
 * Internal dependencies
 */
import BlockDraggableChip from '../draggable-chip';

export default { title: 'Block Editor/BlockDraggable' };

export const _default = () => {
	// Create a wrapper box for the absolutely-positioned child component.
	const wrapperStyle = { margin: '24px 0', position: 'relative' };
	return (
		<div style={ wrapperStyle }>
			<BlockDraggableChip count={ 2 } />
		</div>
	);
};
