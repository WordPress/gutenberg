import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders a paragraph that describes the popover content for accessibility.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function PopoverDescription( { className, children, ...props }, ref ) {
		return (
			<Text
				variant="body-md"
				render={ <_Popover.Description ref={ ref } { ...props } /> }
				className={ clsx( styles.description, className ) }
			>
				{ children }
			</Text>
		);
	}
);

export { Description };
