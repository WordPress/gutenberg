/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { Scrollable } from '../../scrollable';
import { useCardBody } from './hook';
import { CardBodyView } from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').BodyProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                  forwardedRef
 */
function CardBody( props, forwardedRef ) {
	const { isScrollable, ...otherProps } = useCardBody( props );

	if ( isScrollable ) {
		return (
			<Scrollable
				as={ CardBodyView }
				{ ...otherProps }
				ref={ forwardedRef }
			/>
		);
	}

	return <CardBodyView { ...otherProps } ref={ forwardedRef } />;
}

/**
 * `CardBody` renders an optional content area for a `Card`.
 * Multiple `CardBody` components can be used within `Card` if needed.
 *
 * @example
 * ```jsx
 * import { Card, CardBody } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardBody>
 * 		...
 * 	</CardBody>
 * </Card>
 * ```
 */
const ConnectedCardBody = contextConnect( CardBody, 'CardBody' );

export default ConnectedCardBody;
