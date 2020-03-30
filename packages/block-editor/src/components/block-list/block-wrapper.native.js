/**
 * Internal dependencies
 */
import elements from './block-elements';

const ExtendedBlockComponent = elements.reduce( ( acc, element ) => {
	acc[ element ] = element;
	return acc;
}, String );

export const Block = ExtendedBlockComponent;
