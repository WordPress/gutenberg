/**
 * Internal dependencies
 */
import { registerPlugin, unregisterPlugin, getPlugin, getPlugins } from '../';

describe( 'registerPlugin', () => {
	afterEach( () => {
		getPlugins().forEach( ( plugin ) => {
			unregisterPlugin( plugin.name );
		} );
	} );

	it( 'successfully registers a plugin', () => {
		const name = 'plugin';
		const icon = 'smiley';
		const Component = () => 'plugin content';

		registerPlugin( name, {
			render: Component,
			icon,
		} );

		expect( getPlugin( name ) ).toEqual( {
			name,
			render: Component,
			icon,
		} );
	} );

	it( 'successfully registers a plugin with a scope', () => {
		const name = 'plugin';
		const icon = 'smiley';
		const Component = () => 'plugin content';
		const scope = 'scope';

		registerPlugin(
			name,
			{
				render: Component,
				icon,
			},
			scope
		);

		expect( getPlugin( name ) ).toEqual( {
			name,
			render: Component,
			icon,
			scope,
		} );
	} );

	it( 'fails to register a plugin without a settings object', () => {
		registerPlugin();
		expect( console ).toHaveErroredWith( 'No settings object provided!' );
	} );

	it( 'fails to register a plugin with special character in the name', () => {
		registerPlugin( 'plugin/with/special/characters', {
			render: () => {},
		} );
		expect( console ).toHaveErroredWith(
			'Plugin names and scopes must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-plugin".'
		);
	} );

	it( 'fails to register a plugin with a non-string name', () => {
		registerPlugin(
			{},
			{
				render: () => {},
			}
		);
		expect( console ).toHaveErroredWith(
			'Plugin names and scopes must be strings.'
		);
	} );

	it( 'fails to register a plugin without a render function', () => {
		registerPlugin( 'another-plugin', {} );
		expect( console ).toHaveErroredWith(
			'The "render" property must be specified and must be a valid function.'
		);
	} );

	it( 'fails to register a plugin that was already been registered', () => {
		registerPlugin( 'plugin', {
			render: () => 'plugin content',
		} );
		registerPlugin( 'plugin', {
			render: () => 'plugin content',
		} );
		expect( console ).toHaveErroredWith(
			'Plugin "plugin" is already registered.'
		);
	} );

	it( 'fails to register a plugin with a non-string scope', () => {
		registerPlugin(
			'plugin',
			{
				render: () => {},
			},
			{}
		);
		expect( console ).toHaveErroredWith(
			'Plugin names and scopes must be strings.'
		);
	} );

	it( 'fails to register a plugin with special character in the scope', () => {
		registerPlugin(
			'plugin',
			{
				render: () => {},
			},
			'plugin/scope/with/special/characters'
		);
		expect( console ).toHaveErroredWith(
			'Plugin names and scopes must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-plugin".'
		);
	} );
} );

describe( 'getPlugins', () => {
	beforeEach( () => {
		const Component = () => 'plugin content';
		const icon = 'smiley';
		registerPlugin( 'unscoped', {
			render: Component,
			icon,
		} );
		registerPlugin( 'scoped', {
			render: Component,
			icon,
			scope: 'my-scope',
		} );
	} );

	afterEach( () => {
		getPlugins().forEach( ( plugin ) => {
			unregisterPlugin( plugin.name );
		} );
	} );

	it( 'returns all plugins', () => {
		expect( getPlugins() ).toHaveLength( 2 );
	} );

	it( 'returns all plugins of a given scope', () => {
		const scopedPlugins = getPlugins( 'my-scope' );
		expect( scopedPlugins ).toHaveLength( 1 );
		expect( scopedPlugins[ 0 ].name ).toBe( 'scoped' );
	} );
} );
