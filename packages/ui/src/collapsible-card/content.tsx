import { Collapsible } from '@base-ui/react/collapsible';
import { forwardRef } from '@wordpress/element';
import * as Card from '../card';
import type { ContentProps } from './types';

/**
 * The collapsible content area of the card. Hidden when collapsed,
 * visible when expanded.
 */
export const Content = forwardRef< HTMLDivElement, ContentProps >(
	function CollapsibleCardContent( { render, ...restProps }, ref ) {
		return (
			<Collapsible.Panel
				ref={ ref }
				render={ <Card.Content render={ render } /> }
				{ ...restProps }
			/>
		);
	}
);
