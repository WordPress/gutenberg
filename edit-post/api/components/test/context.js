/**
 * External dependencies
 */
import ReactTestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PluginContextProvider, withPluginContext } from '../context';

describe( 'plugin/context', () => {
	describe( 'withPluginContext', () => {
		it( 'passed the plugin context to the decorated component', () => {
			const Component = ( props ) => {
				return props.pluginContext;
			};

			const WrappedComponent = withPluginContext( Component );

			const renderer = ReactTestRenderer.create(
				<PluginContextProvider value="plugin-namespace">
					<div>
						<WrappedComponent />
					</div>
				</PluginContextProvider>
			);

			const tree = renderer.toJSON();

			expect( tree.children[ 0 ] ).toEqual( 'plugin-namespace' );
		} );
	} );
} );
