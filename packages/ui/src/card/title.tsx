import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { TitleProps } from './types';

/**
 * The title for a card. Renders as a `<div>` by default — use the `render`
 * prop to swap in a semantic heading element when appropriate.
 */
export const Title = forwardRef< HTMLDivElement, TitleProps >(
	function CardTitle( { render, children, ...props }, ref ) {
		return (
			<Text
				variant="heading-lg"
				render={ render ?? <div ref={ ref } { ...props } /> }
			>
				{ children }
			</Text>
		);
	}
);
