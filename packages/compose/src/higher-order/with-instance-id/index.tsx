/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import useInstanceId from '../../hooks/use-instance-id';

/**
 * A Higher Order Component used to be provide a unique instance ID by
 * component.
 */
const withInstanceId = createHigherOrderComponent< {
	instanceId: string | number;
} >( ( WrappedComponent ) => {
	return ( props ) => {
		const instanceId = useInstanceId( WrappedComponent );
		// @ts-ignore
		return <WrappedComponent { ...props } instanceId={ instanceId } />;
	};
}, 'withInstanceId' );

export default withInstanceId;
