import { forwardRef } from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import type { ContentProps } from './types';
import * as Card from '../card';

/**
 * The collapsible content area of the card. Hidden when collapsed,
 * visible when expanded.
 */
export const Content = forwardRef< HTMLDivElement, ContentProps >(
	function CollapsibleCardContent(
		{ children, className, render, ...restProps },
		ref
	) {
		return (
			<Collapsible.Panel
				ref={ ref }
				className={ className }
				render={ <Card.Content render={ render } /> }
				{ ...restProps }
			>
				{ children }
			</Collapsible.Panel>
		);
	}
);
