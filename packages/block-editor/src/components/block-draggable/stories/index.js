/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { BlockDraggableChip } from '../draggable-chip';

export default { title: 'BlockEditor/BlockDraggable' };

export const _default = () => {
	return <BlockDraggableChip icon={ wordpress } label="WordPress" />;
};
