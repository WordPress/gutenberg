/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Separator } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../ui/context';
import { DividerView } from './styles';
import type { Props } from './types';

function Divider(
	props: PolymorphicComponentProps< Props, 'hr', false >,
	forwardedRef: Ref< any >
) {
	const contextProps = useContextSystem( props, 'Divider' );

	return (
		<Separator
			as={ DividerView }
			{ ...contextProps }
			ref={ forwardedRef }
		/>
	);
}

/**
 * `Divider` is a layout component that separates groups of related content.
 *
 * @example
 * ```js
 * import {
 *     __experimentalDivider as Divider,
 *     __experimentalText as Text }
 * from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<ListGroup>
 * 			<FormGroup>...</FormGroup>
 * 			<Divider />
 * 			<FormGroup>...</FormGroup>
 * 		</ListGroup>
 * 	);
 * }
 * ```
 */
const ConnectedDivider = contextConnect( Divider, 'Divider' );

export default ConnectedDivider;
