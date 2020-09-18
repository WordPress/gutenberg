/**
 * Internal dependencies
 */
import ELEMENTS from './block-wrapper-elements';

export function useBlockWrapperProps( props = {} ) {
	return props;
}

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = element;
	return acc;
}, String );

export const Block = ExtendedBlockComponent;
