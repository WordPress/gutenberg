/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { Flex } from '../../flex';
import { useCardHeader } from './hook';
import type { HeaderProps } from '../types';

function UnconnectedCardHeader(
	props: WordPressComponentProps< HeaderProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const headerProps = useCardHeader( props );

	return <Flex { ...headerProps } ref={ forwardedRef } />;
}

/**
 * `CardHeader` renders an optional header within a `Card`.
 *
 * ```jsx
 * import { Card, CardBody, CardHeader } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardHeader>...</CardHeader>
 * 	<CardBody>...</CardBody>
 * </Card>
 * ```
 */
export const CardHeader = contextConnect( UnconnectedCardHeader, 'CardHeader' );

export default CardHeader;
