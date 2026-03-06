import { Collapsible } from '@base-ui/react/collapsible';

import { forwardRef } from '@wordpress/element';

import * as Card from '../card';
import type { RootProps } from './types';

/**
 * A card that can be expanded and collapsed. When collapsed, only the
 * header is visible.
 *
 * ```jsx
 * import { CollapsibleCard, Card } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<CollapsibleCard.Root defaultOpen>
 * 			<CollapsibleCard.Header>
 * 				<Card.Title>Heading</Card.Title>
 * 			</CollapsibleCard.Header>
 * 			<CollapsibleCard.Content>
 * 				<p>Collapsible content here.</p>
 * 			</CollapsibleCard.Content>
 * 		</CollapsibleCard.Root>
 * 	);
 * }
 * ```
 */
export const Root = forwardRef< HTMLDivElement, RootProps >(
	function CollapsibleCardRoot(
		{
			children,
			open,
			defaultOpen,
			onOpenChange,
			disabled,
			render,
			...restProps
		},
		ref
	) {
		return (
			<Collapsible.Root
				ref={ ref }
				open={ open }
				defaultOpen={ defaultOpen }
				onOpenChange={ onOpenChange }
				disabled={ disabled }
				render={ <Card.Root render={ render } /> }
				{ ...restProps }
			>
				{ children }
			</Collapsible.Root>
		);
	}
);
