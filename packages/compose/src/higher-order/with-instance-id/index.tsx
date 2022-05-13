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
const withInstanceId = createHigherOrderComponent<
	< Props extends ComponentProps< any > >(
		Inner: ComponentType< Props >
	) => ComponentType< Props & { instanceId: string | number } >
>(
	( WrappedComponent ) => ( props ) => (
		<WrappedComponent
			{ ...props }
			instanceId={ useInstanceId( WrappedComponent ) }
		/>
	),
	'instanceId'
);

export default withInstanceId;
