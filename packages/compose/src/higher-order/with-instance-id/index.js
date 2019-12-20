/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import useInstanceId from '../../hooks/use-instance-id';

/**
 * A Higher Order Component used to be provide a unique instance ID by
 * component.
 *
 * @param {WPComponent} WrappedComponent The wrapped component.
 *
 * @return {WPComponent} Component with an instanceId prop.
 */
export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const instanceId = useInstanceId( WrappedComponent );
		return <WrappedComponent { ...props } instanceId={ instanceId } />;
	};
}, 'withInstanceId' );
