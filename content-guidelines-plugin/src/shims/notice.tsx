/**
 * Plugin-local shim for @wordpress/ui Notice component.
 *
 * @wordpress/ui is an internal Gutenberg package (wpScript: false)
 * that uses private APIs, so it can't be used from plugins. This
 * replicates the compound component API: Notice.Root, Notice.Title,
 * Notice.Description, Notice.CloseIcon.
 */

import { Button } from '@wordpress/components';
import { close as closeIcon } from '@wordpress/icons';

function Root( {
	intent,
	children,
	className,
	...props
}: {
	intent?: 'error' | 'warning' | 'success' | 'info';
	children: React.ReactNode;
	className?: string;
} & React.HTMLAttributes< HTMLDivElement > ) {
	const statusClass = intent ? `is-${ intent }` : '';
	const classes = [ 'components-notice', statusClass, className ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div className={ classes } { ...props }>
			<div className="components-notice__content">
				{ children }
			</div>
		</div>
	);
}

function Title( {
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
} ) {
	return (
		<span className={ className }>
			{ children }
		</span>
	);
}

function Description( { children }: { children: React.ReactNode } ) {
	return (
		<span className="components-notice__description">
			{ ' ' }
			{ children }
		</span>
	);
}

function CloseIcon( { onClick }: { onClick: () => void } ) {
	return (
		<Button
			className="components-notice__dismiss"
			icon={ closeIcon }
			label="Dismiss"
			onClick={ onClick }
			size="small"
		/>
	);
}

export const Notice = {
	Root,
	Title,
	Description,
	CloseIcon,
};
