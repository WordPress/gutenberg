/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { useCardFooter } from './hook';
import { CardFooterView } from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').FooterProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                    forwardedRef
 */
function CardFooter( props, forwardedRef ) {
	const footerProps = useCardFooter( props );

	return <CardFooterView { ...footerProps } ref={ forwardedRef } />;
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
