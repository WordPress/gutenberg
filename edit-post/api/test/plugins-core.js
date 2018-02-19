import '@wordpress/jest-console';

let registerPlugin, activatePlugin, validatePluginId;
function requireAll() {
	const core = require( '../plugins-core' );
	registerPlugin = core.registerPlugin;
	activatePlugin = core.activatePlugin;
	validatePluginId = core.validatePluginId;
}

requireAll();

describe( 'validatePluginId', () => {
	it( 'accepts a valid plugin id', () => {
		expect( validatePluginId( 'gutenberg/plugin' ) ).toBe( true );
	} );

	it( 'rejects a pluginId with special characters besides a single "/"', () => {
		const valid = validatePluginId( 'gutenberg//plugin' );
		expect( console ).toHaveErrored();
		expect( valid ).toBe( false );
	} );

	it( 'rejects a pluginId that\'s a number', () => {
		expect( validatePluginId( 1 ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );

	it( 'rejects a pluginId that\'s an object', () => {
		expect( validatePluginId( {} ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );
} );

describe( 'registerPlugin', () => {
	beforeEach( () => {
		jest.resetModules();
		requireAll();
	} );

	it( 'adds a plugin', () => {
		registerPlugin(
			'gutenberg/plugin',
			() => {}
		);
	} );

	it( 'prints an error when the plugin id already exists', () => {
		registerPlugin(
			'gutenberg/plugin',
			() => {}
		);
		registerPlugin(
			'gutenberg/plugin',
			() => {}
		);
		expect( console ).toHaveErroredWith( 'Plugin "gutenberg/plugin" has already been registered' );
	} );

	it( 'allows a second plugin to be registered', () => {
		registerPlugin(
			'gutenberg/plugin',
			() => {}
		);
		registerPlugin(
			'gutenberg/plugin2',
			() => {}
		);
	} );
} );

describe( 'activatePlugin', () => {
	beforeEach( () => {
		jest.resetModules();
		requireAll();
	} );

	it( 'calls the callback that was provided to registerPlugin', () => {
		const callback = jest.fn();
		registerPlugin(
			'gutenberg/plugin',
			callback
		);
		activatePlugin( 'gutenberg/plugin' );
		expect( callback ).toHaveBeenCalled();
	} );
} );
