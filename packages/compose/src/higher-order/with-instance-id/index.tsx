/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import type { PropInjectingHigherOrderComponent } from '../../utils/create-higher-order-component';
import useInstanceId from '../../hooks/use-instance-id';

/**
 * A Higher Order Component used to be provide a unique instance ID by
 * component.
 */
const withInstanceId: PropInjectingHigherOrderComponent< {
	instanceId: string | number;
} > = createHigherOrderComponent(
	< TProps extends { instanceId: string | number } >(
		WrappedComponent: ComponentType< TProps >
	) => {
		return ( props: Omit< TProps, 'instanceId' > ) => {
			const instanceId = useInstanceId( WrappedComponent );
			return (
				<WrappedComponent
					{ ...( props as TProps ) }
					instanceId={ instanceId }
				/>
			);
		};
	},
	'withInstanceId'
);

export default withInstanceId;
