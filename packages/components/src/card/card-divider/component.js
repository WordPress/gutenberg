/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { Divider } from '../../divider';
import { useCardDivider } from './hook';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../../divider').DividerProps, 'hr', false>} props
 * @param {import('react').ForwardedRef<any>}                                                                     forwardedRef
 */
function CardDivider( props, forwardedRef ) {
	const dividerProps = useCardDivider( props );

	return <Divider { ...dividerProps } ref={ forwardedRef } />;
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
