/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { Scrollable } from '../../scrollable';
import { View } from '../../view';
import { useCardBody } from './hook';
import type { BodyProps } from '../types';

function UnconnectedCardBody(
	props: WordPressComponentProps< BodyProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { isScrollable, ...otherProps } = useCardBody( props );

	if ( isScrollable ) {
		return <Scrollable { ...otherProps } ref={ forwardedRef } />;
	}

	return <View { ...otherProps } ref={ forwardedRef } />;
}

/**
 * `CardBody` renders an optional content area for a `Card`.
 * Multiple `CardBody` components can be used within `Card` if needed.
 *
 * ```jsx
 * import { Card, CardBody } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardBody>
 * 		...
 * 	</CardBody>
 * </Card>
 * ```
 */
export const CardBody = contextConnect( UnconnectedCardBody, 'CardBody' );

export default CardBody;
