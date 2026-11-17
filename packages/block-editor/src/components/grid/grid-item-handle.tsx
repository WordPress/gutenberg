import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

interface GridItemHandleProps extends Omit<
	ComponentPropsWithoutRef< 'div' >,
	'title'
> {
	/** Rotation of the grid item in degrees. */
	angle: number;
	/** Shown when hovering the handle. */
	label: string;
}

/**
 * A handle on the canvas around a selected grid item.
 *
 * It looks like a block toolbar with a single button, because it does what a
 * toolbar button does, closer to the block. It sits inside the overlay that
 * turns with the block, and turns the other way so that it stays upright like
 * the toolbar.
 *
 * Handles only work with a pointer, so they are hidden from assistive
 * technology. Each action they start is also available from the keyboard
 * elsewhere.
 */
export function GridItemHandle( {
	angle,
	label,
	className,
	style,
	children,
	...props
}: GridItemHandleProps ) {
	return (
		<div
			{ ...props }
			className={ clsx( 'block-editor-grid-item-handle', className ) }
			title={ label }
			aria-hidden="true"
			style={ { ...style, rotate: `${ -angle }deg` } }
		>
			{ children }
		</div>
	);
}
