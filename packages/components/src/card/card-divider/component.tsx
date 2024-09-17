/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import type { DividerProps } from '../../divider';
import { Divider } from '../../divider';
import { useCardDivider } from './hook';

function UnconnectedCardDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) {
	const dividerProps = useCardDivider( props );

	return <Divider { ...dividerProps } ref={ forwardedRef } />;
}

/**
 * `CardDivider` renders an optional divider within a `Card`.
 * It is typically used to divide multiple `CardBody` components from each other.
 *
 * ```jsx
 * import { Card, CardBody, CardDivider } from `@wordpress/components`;
 *
 * <Card>
 *  <CardBody>...</CardBody>
 *  <CardDivider />
 *  <CardBody>...</CardBody>
 * </Card>
 * ```
 */
export const CardDivider = contextConnect(
	UnconnectedCardDivider,
	'CardDivider'
);

export default CardDivider;
