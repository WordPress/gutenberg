/**
 * WordPress dependencies
 */
import { getBlockProps } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ELEMENTS from './block-wrapper-elements';

export function useBlockWrapperProps( props = {} ) {
	return props;
}

useBlockWrapperProps.save = getBlockProps;

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = element;
	return acc;
}, String );

export const Block = ExtendedBlockComponent;
