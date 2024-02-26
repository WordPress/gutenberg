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
import { useCardFooter } from './hook';
import type { FooterProps } from '../types';

function UnconnectedCardFooter(
	props: WordPressComponentProps< FooterProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const footerProps = useCardFooter( props );

	return <Flex { ...footerProps } ref={ forwardedRef } />;
}

/**
 * `CardFooter` renders an optional footer within a `Card`.
 *
 * ```jsx
 * import { Card, CardBody, CardFooter } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardBody>...</CardBody>
 * 	<CardFooter>...</CardFooter>
 * </Card>
 * ```
 */
export const CardFooter = contextConnect( UnconnectedCardFooter, 'CardFooter' );

export default CardFooter;
