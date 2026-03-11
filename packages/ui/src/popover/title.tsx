import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { TitleProps } from './types';

/**
 * Renders a heading that labels the popover for accessibility.
 */
const Title = forwardRef< HTMLHeadingElement, TitleProps >(
	function PopoverTitle( { className, ...props }, ref ) {
		return (
			<_Popover.Title
				ref={ ref }
				className={ clsx( styles.title, className ) }
				{ ...props }
			/>
		);
	}
);

export { Title };
