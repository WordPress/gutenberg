/**
 * Internal dependencies
 */
import ELEMENTS from './block-elements';

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = element;
	return acc;
}, String );

export const Block = ExtendedBlockComponent;
