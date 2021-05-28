/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { View } from '../../view';
import { useCardDivider } from './hook';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<{}, 'hr'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function CardDivider( props, forwardedRef ) {
	const { as = 'hr', ...otherProps } = useCardDivider( props );

	// Should it add the `components-card__divider` className ?
	return <View { ...otherProps } as={ as } ref={ forwardedRef } />;
}

/**
 * CardDivider renders an optional divider within a `<Card />
 *
 * @example
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
const ConnectedCardDivider = contextConnect( CardDivider, 'CardDivider' );

export default ConnectedCardDivider;
