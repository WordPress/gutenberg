/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { useCardDivider } from './hook';
import { CardDividerView } from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../../divider').DividerProps, 'hr', false>} props
 * @param {import('react').Ref<any>}                                                                                forwardedRef
 */
function CardDivider( props, forwardedRef ) {
	const dividerProps = useCardDivider( props );

	return <CardDividerView { ...dividerProps } ref={ forwardedRef } />;
}

/**
 * `CardDivider` renders an optional divider within a `Card`.
 * It is typically used to divide multiple `CardBody` components from each other.
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
