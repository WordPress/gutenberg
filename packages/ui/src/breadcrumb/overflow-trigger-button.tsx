import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import type { ButtonProps } from '../button/types';
import styles from './style.module.css';

const OverflowTriggerButton = forwardRef< HTMLButtonElement, ButtonProps >(
	function OverflowTriggerButton( { children, className, ...props }, ref ) {
		return (
			<Button
				{ ...props }
				ref={ ref }
				className={ clsx( styles[ 'overflow-trigger' ], className ) }
				size="small"
				tone="neutral"
				variant="minimal"
			>
				{ children ?? <span aria-hidden="true">…</span> }
			</Button>
		);
	}
);

export { OverflowTriggerButton };
