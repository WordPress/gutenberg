/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import PluginContextProvider from '../index';
import withPluginContext from '../../higher-order/with-plugin-context';

describe( 'plugin/context', () => {
	describe( 'withPluginContext', () => {
		it( 'passed the plugin context to the decorated component', () => {
			const Component = ( props ) => {
				return props.pluginContext;
			};

			const WrappedComponent = withPluginContext( Component );

			const MountedComponent = mount(
				<PluginContextProvider value="plugin-namespace">
					<div>
						<WrappedComponent />
					</div>
				</PluginContextProvider>
			);

			expect( MountedComponent.find( Component ).props().pluginContext ).toEqual( 'plugin-namespace' );
		} );
	} );
} );
