import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

interface GridItemHandleProps extends Omit<
	ComponentPropsWithoutRef< 'div' >,
	'title'
> {
	/** Shown when hovering the handle. */
	label: string;
}

/**
 * A button in the toolbar of handles around a selected grid item.
 *
 * Handles only work with a pointer, so they are hidden from assistive
 * technology. Each action they start is also available from the keyboard
 * elsewhere.
 */
export function GridItemHandle( {
	label,
	className,
	children,
	...props
}: GridItemHandleProps ) {
	return (
		<div
			{ ...props }
			className={ clsx( 'block-editor-grid-item-handle', className ) }
			title={ label }
			aria-hidden="true"
		>
			{ children }
		</div>
	);
}
