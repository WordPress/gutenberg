/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { Flex } from '../../flex';
import { useCardFooter } from './hook';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').FooterProps, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                                         forwardedRef
 */
function CardFooter( props, forwardedRef ) {
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
