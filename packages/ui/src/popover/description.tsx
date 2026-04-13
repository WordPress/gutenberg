import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders an optional paragraph that describes the popover content.
 *
 * The rendered element is linked to the popup via `aria-describedby`.
 * Uses the `body-md` text variant by default.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function PopoverDescription( { className, children, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				render={ <_Popover.Description { ...props } /> }
				className={ clsx( styles.description, className ) }
			>
				{ children }
			</Text>
		);
	}
);

export { Description };
