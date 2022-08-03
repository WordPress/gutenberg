/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { Flex } from '../../flex';
import { useCardFooter } from './hook';
import type { FooterProps } from '../types';

function CardFooter(
	props: WordPressComponentProps< FooterProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const footerProps = useCardFooter( props );

	return <Flex { ...footerProps } ref={ forwardedRef } />;
}

/**
 * `CardFooter` renders an optional footer within a `Card`.
 *
 * @example
 * ```jsx
 * import { Card, CardBody, CardFooter } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardBody>...</CardBody>
 * 	<CardFooter>...</CardFooter>
 * </Card>
 * ```
 */
const ConnectedCardFooter = contextConnect( CardFooter, 'CardFooter' );

export default ConnectedCardFooter;
