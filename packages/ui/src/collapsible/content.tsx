import { Collapsible } from '@base-ui/react/collapsible';
import { forwardRef } from '@wordpress/element';
import type { ContentProps } from './types';

const Content = forwardRef< HTMLDivElement, ContentProps >(
	function CollapsibleContent( { children, ...props }, ref ) {
		return (
			<Collapsible.Panel ref={ ref } { ...props }>
				{ children }
			</Collapsible.Panel>
		);
	}
);

export { Content };
