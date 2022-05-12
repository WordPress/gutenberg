/**
 * External dependencies
 */
import type { ComponentProps, ComponentType } from 'react';

/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import useInstanceId from '../../hooks/use-instance-id';

/**
 * A Higher Order Component used to be provide a unique instance ID by
 * component.
 */
const withInstanceId: < Inner extends ComponentType< any > >(
	Inner: Inner
) => ComponentType<
	Omit< ComponentProps< Inner >, 'instanceId' >
> = createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const instanceId = useInstanceId( WrappedComponent );
		return <WrappedComponent { ...props } instanceId={ instanceId } />;
	};
}, 'instanceId' );

export default withInstanceId;
