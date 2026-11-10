import clsx from 'clsx';
import type { ComponentProps, ComponentPropsWithoutRef } from 'react';
import { Button } from '@wordpress/components';

interface GridItemHandleProps extends Omit<
	ComponentPropsWithoutRef< 'button' >,
	'title' | 'type'
> {
	/** The handle's accessible name, also shown when hovering it. */
	label: string;
	/** The handle's icon, when it shows no other content. */
	icon?: ComponentProps< typeof Button >[ 'icon' ];
}

/**
 * A handle in the toolbar of handles around a selected grid item, which drags
 * or turns the block with a pointer.
 *
 * Like the drag handle in the block toolbar, it can't be reached with Tab or
 * the arrow keys, because it only works with a pointer. Each action it starts
 * is also available from the keyboard elsewhere.
 */
export function GridItemHandle( {
	label,
	icon,
	className,
	children,
	...props
}: GridItemHandleProps ) {
	return (
		<Button
			{ ...props }
			size="small"
			icon={ icon }
			label={ label }
			className={ clsx( 'block-editor-grid-item-handle', className ) }
			tabIndex={ -1 }
		>
			{ children }
		</Button>
	);
}
