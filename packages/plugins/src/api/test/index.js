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

	it( 'fails to register a plugin without a settings object', () => {
		registerPlugin();
		expect( console ).toHaveErroredWith( 'No settings object provided!' );
	} );

	it( 'fails to register a plugin with special character in the name', () => {
		registerPlugin( 'plugin/with/special/characters', {
			render: () => {},
		} );
		expect( console ).toHaveErroredWith(
			'Plugin name must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-plugin".'
		);
	} );

	it( 'fails to register a plugin with a non-string name', () => {
		registerPlugin(
			{},
			{
				render: () => {},
			}
		);
		expect( console ).toHaveErroredWith( 'Plugin name must be string.' );
	} );

	it( 'fails to register a plugin without a render function', () => {
		registerPlugin( 'another-plugin', {} );
		expect( console ).toHaveErroredWith(
			'The "render" property must be specified and must be a valid function.'
		);
	} );

	it( 'fails to register a plugin with a non-string scope', () => {
		registerPlugin( 'my-plugin', {
			render: () => {},
			scope: {},
		} );
		expect( console ).toHaveErroredWith( 'Plugin scope must be string.' );
	} );

	it( 'fails to register a plugin with special character in the scope', () => {
		registerPlugin( 'my-plugin', {
			render: () => {},
			scope: 'special/characters!',
		} );
		expect( console ).toHaveErroredWith(
			'Plugin scope must include only lowercase alphanumeric characters or dashes, and start with a letter. Example: "my-page".'
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
} );

describe( 'getPlugins', () => {
	const scope = 'my-page';

	beforeAll( () => {
		const Component = () => 'plugin content';
		const icon = 'smiley';

		registerPlugin( 'unscoped', {
			render: Component,
			icon,
		} );
		registerPlugin( 'scoped', {
			render: Component,
			icon,
			scope,
		} );
	} );

	afterAll( () => {
		unregisterPlugin( 'unscoped' );
		unregisterPlugin( 'scoped' );
	} );

	it( 'returns all unscoped plugins', () => {
		expect( getPlugins() ).toHaveLength( 1 );
	} );

	it( 'returns all plugins of a given scope', () => {
		const scopedPlugins = getPlugins( scope );
		expect( scopedPlugins ).toHaveLength( 1 );
		expect( scopedPlugins[ 0 ].name ).toBe( 'scoped' );
	} );
} );
