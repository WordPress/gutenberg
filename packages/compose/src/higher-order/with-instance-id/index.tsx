/**
 * Internal dependencies
 */
import type {
	WithInjectedProps,
	WithoutInjectedProps,
} from '../../utils/create-higher-order-component';
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import useInstanceId from '../../hooks/use-instance-id';

type InstanceIdProps = { instanceId: string | number };

/**
 * A Higher Order Component used to provide a unique instance ID by component.
 */
const withInstanceId = createHigherOrderComponent(
	< C extends WithInjectedProps< C, InstanceIdProps > >(
		WrappedComponent: C
	) => {
		return ( props: WithoutInjectedProps< C, InstanceIdProps > ) => {
			const instanceId = useInstanceId( WrappedComponent );
			// @ts-ignore
			return <WrappedComponent { ...props } instanceId={ instanceId } />;
		};
	},
	'instanceId'
);

export default withInstanceId;
