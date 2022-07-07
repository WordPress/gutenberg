/**
 * WordPress dependencies
 */
import { __unstableGetBlockProps as getBlockProps } from '@wordpress/blocks';

export function useBlockProps( props = {} ) {
	return { ...props, style: { ...{ flex: 1 }, ...props.style } };
}

useBlockProps.save = getBlockProps;
