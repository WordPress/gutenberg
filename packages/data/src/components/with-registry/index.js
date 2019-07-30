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
 *
 * @param {WPComponent} OriginalComponent Original component.
 *
 * @return {WPComponent} Enhanced component.
 */
const withRegistry = createHigherOrderComponent(
	( OriginalComponent ) => ( props ) => (
		<RegistryConsumer>
			{ ( registry ) => (
				<OriginalComponent
					{ ...props }
					registry={ registry }
				/>
			) }
		</RegistryConsumer>
	),
	'withRegistry'
);

export default withRegistry;
