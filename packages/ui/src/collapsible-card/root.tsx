import { forwardRef } from '@wordpress/element';
import * as Card from '../card';
import * as Collapsible from '../collapsible';
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
	function CollapsibleCardRoot( { render, ...restProps }, ref ) {
		return (
			<Collapsible.Root
				ref={ ref }
				render={ <Card.Root render={ render } /> }
				{ ...restProps }
			/>
		);
	}
);
