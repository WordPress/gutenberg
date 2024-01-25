/**
 * External dependencies
 */
// eslint-disable-next-line testing-library/no-manual-cleanup
import { act, render, cleanup } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { getPlugins, unregisterPlugin, registerPlugin } from '../../api';
import PluginArea from '../plugin-area';

describe( 'PluginArea', () => {
	afterEach( () => {
		// Unmount components before unregistering the plugins.
		// RTL uses top-level `afterEach` for cleanup, executed after this teardown.
		cleanup();
		getPlugins().forEach( ( plugin ) => {
			unregisterPlugin( plugin.name );
		} );
		getPlugins( 'my-app' ).forEach( ( plugin ) => {
			unregisterPlugin( plugin.name );
		} );
	} );

	const TestComponent = ( { content } ) => {
		return `plugin: ${ content }.`;
	};

	test( 'renders unscoped plugin', () => {
		registerPlugin( 'unscoped', {
			render: () => <TestComponent content="unscoped" />,
			icon: 'smiley',
		} );

		const { container } = render( <PluginArea /> );

		expect( container ).toHaveTextContent( 'plugin: unscoped.' );
	} );

	test( 'renders scoped plugin', () => {
		registerPlugin( 'scoped', {
			render: () => <TestComponent content="scoped" />,
			icon: 'smiley',
			scope: 'my-app',
		} );

		const { container } = render( <PluginArea scope="my-app" /> );

		expect( container ).toHaveTextContent( 'plugin: scoped.' );
	} );

	test( 'rerenders when a new plugin is registered', () => {
		registerPlugin( 'foo', {
			render: () => <TestComponent content="foo" />,
			icon: 'smiley',
			scope: 'my-app',
		} );

		const { container } = render( <PluginArea scope="my-app" /> );

		act( () => {
			registerPlugin( 'bar', {
				render: () => <TestComponent content="bar" />,
				icon: 'smiley',
				scope: 'my-app',
			} );
		} );

		expect( container ).toHaveTextContent( 'plugin: bar.' );
	} );

	test( 'rerenders when a plugin is unregistered', () => {
		registerPlugin( 'one', {
			render: () => <TestComponent content="one" />,
			icon: 'smiley',
			scope: 'my-app',
		} );
		registerPlugin( 'two', {
			render: () => <TestComponent content="two" />,
			icon: 'smiley',
			scope: 'my-app',
		} );

		const { container } = render( <PluginArea scope="my-app" /> );

		expect( container ).toHaveTextContent( 'plugin: one.plugin: two.' );

		act( () => {
			unregisterPlugin( 'one' );
		} );

		expect( container ).toHaveTextContent( 'plugin: two.' );
	} );

	test( 'does not rerender when a plugin is added to a different scope', () => {
		const ComponentSpy = jest.fn( ( { content } ) => {
			return `plugin: ${ content }.`;
		} );

		registerPlugin( 'scoped', {
			render: () => <ComponentSpy content="scoped" />,
			icon: 'smiley',
			scope: 'my-app',
		} );

		render( <PluginArea scope="my-app" /> );

		act( () => {
			registerPlugin( 'unscoped', {
				render: () => <TestComponent content="unscoped" />,
				icon: 'smiley',
			} );
		} );

		expect( ComponentSpy ).toHaveBeenCalledTimes( 1 );
	} );
} );
