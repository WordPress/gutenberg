/**
 * WordPress dependencies
 */
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';

export function useBlockProps( props = {} ) {
	return props;
}

useBlockProps.save = getBlockProps;
