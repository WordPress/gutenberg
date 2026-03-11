import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders a paragraph that describes the popover content for accessibility.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function PopoverDescription( { className, ...props }, ref ) {
		return (
			<_Popover.Description
				ref={ ref }
				className={ clsx( styles.description, className ) }
				{ ...props }
			/>
		);
	}
);

export { Description };
