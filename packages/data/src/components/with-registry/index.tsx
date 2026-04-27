/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { RegistryConsumer } from '../registry-provider';

/**
 * Higher-order component which renders the original component with the current
 * registry context passed as its `registry` prop.
 */
const withRegistry = createHigherOrderComponent(
	( OriginalComponent ) => ( props: Record< string, unknown > ) => (
		<RegistryConsumer>
			{ ( registry ) => (
				<OriginalComponent { ...props } registry={ registry } />
			) }
		</RegistryConsumer>
	),
	'withRegistry'
);

export default withRegistry;
