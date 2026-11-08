import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { DescriptionProps } from './types';

/**
 * Renders an optional paragraph that describes the popover content.
 *
 * The rendered element is linked to the popup via `aria-describedby`.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function PopoverDescription( { children, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				render={ <_Popover.Description { ...props } /> }
			>
				{ children }
			</Text>
		);
	}
);

export { Description };
