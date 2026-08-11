import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { RootProps } from './types';

/**
 * A visually contained surface that groups related content and actions.
 *
 * ```jsx
 * import { Card } from '@wordpress/ui';
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
	{ render, ...restProps },
	ref
) {
	const mergedClassName = clsx( styles.root, resetStyles[ 'box-sizing' ] );

	const element = useRender( {
		defaultTagName: 'div',
		render,
		ref,
		props: mergeProps< 'div' >( { className: mergedClassName }, restProps ),
	} );

	return element;
} );
