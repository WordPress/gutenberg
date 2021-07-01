/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { useCardHeader } from './hook';
import { CardHeaderView } from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').HeaderProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                    forwardedRef
 */
function CardHeader( props, forwardedRef ) {
	const headerProps = useCardHeader( props );

	return <CardHeaderView { ...headerProps } ref={ forwardedRef } />;
}

/**
 * `CardHeader` renders an optional header within a `Card`.
 *
 * @example
 * ```jsx
 * import { Card, CardBody, CardHeader } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardHeader>...</CardHeader>
 * 	<CardBody>...</CardBody>
 * </Card>
 * ```
 */
const ConnectedCardHeader = contextConnect( CardHeader, 'CardHeader' );

export default ConnectedCardHeader;
