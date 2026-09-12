import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Stack } from '../../../stack';
import styles from './style.module.css';
import type { CheckboxGroupNestedItemsProps } from './types';

/**
 * A layout wrapper that indents nested checkbox items.
 */
export const CheckboxGroupNestedItems = forwardRef<
	HTMLDivElement,
	CheckboxGroupNestedItemsProps
>( function CheckboxGroupNestedItems( { className, ...restProps }, ref ) {
	return (
		<Stack
			ref={ ref }
			className={ clsx( styles[ 'nested-items' ], className ) }
			direction="column"
			gap="sm"
			{ ...restProps }
		/>
	);
} );

CheckboxGroupNestedItems.displayName = 'CheckboxGroup.NestedItems';
