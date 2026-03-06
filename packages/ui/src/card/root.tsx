import { forwardRef } from 'react';
import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import resetStyles from '../utils/css/resets.module.css';
import type { RootProps } from './types';
import styles from './style.module.css';

/**
 * A visually contained surface that groups related content and actions.
 *
 * ```jsx
 * import { Card } from '@automattic/design-system';
 *
 * function MyComponent() {
 * 	return (
 * 		<Card.Root>
 * 			<Card.Header>
 * 				<Card.Title>Heading</Card.Title>
 * 			</Card.Header>
 * 			<Card.Content>
 * 				<p>Main content here.</p>
 * 			</Card.Content>
 * 		</Card.Root>
 * 	);
 * }
 * ```
 */
export const Root = forwardRef< HTMLDivElement, RootProps >( function Card(
	{ children, render, ...restProps },
	ref
) {
	const mergedClassName = clsx( styles.root, resetStyles[ 'box-sizing' ] );

	const element = useRender( {
		defaultTagName: 'div',
		render,
		ref,
		props: mergeProps< 'div' >(
			{ className: mergedClassName, children },
			restProps
		),
	} );

	return element;
} );
