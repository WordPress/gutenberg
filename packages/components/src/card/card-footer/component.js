/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { Flex } from '../../flex';
import { useCardFooter } from './hook';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').FooterProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardFooter( props, forwardedRef ) {
	const { justify = 'flex-end', ...otherProps } = useCardFooter( props );

	return <Flex { ...otherProps } justify={ justify } ref={ forwardedRef } />;
}

/**
 * `CardFooter` is a layout component, rendering the footer content of a `Card`.
 *
 * @example
 * ```jsx
 * import { Card, CardBody, CardFooter } from `@wordpress/components/ui`;
 *
 * <Card>
 * 	<CardBody>...</CardBody>
 * 	<CardFooter>...</CardFooter>
 * </Card>
 * ```
 */
const ConnectedCardFooter = contextConnect( CardFooter, 'CardFooter' );

export default ConnectedCardFooter;
