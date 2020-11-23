/**
 * WordPress dependencies
 */
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ELEMENTS from './block-wrapper-elements';

export function useBlockProps( props = {} ) {
	return props;
}

useBlockProps.save = getBlockProps;

const ExtendedBlockComponent = ELEMENTS.reduce( ( acc, element ) => {
	acc[ element ] = element;
	return acc;
}, String );

export const Block = ExtendedBlockComponent;
