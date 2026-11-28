import type { CSSProperties } from 'react';
import type { Meta } from '@storybook/react-vite';
import BlockDraggableChip from '../draggable-chip';

const meta: Meta< typeof BlockDraggableChip > = {
	id: 'blockeditor-blockdraggable',
	title: 'Editor/Block Editor/BlockDraggable',
};

export default meta;

export const _default = () => {
	// Create a wrapper box for the absolutely-positioned child component.
	const wrapperStyle: CSSProperties = {
		margin: '24px 0',
		position: 'relative',
	};
	return (
		<div style={ wrapperStyle }>
			<BlockDraggableChip count={ 2 } />
		</div>
	);
};
