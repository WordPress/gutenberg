import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig, getServerState, populateServerData, store } from '../store';
import { getContext, getServerContext, resetScope, setScope } from '../scopes';
import { resetNamespace, setNamespace } from '../namespaces';
import { logged } from '../utils';
import { getInteractiveNamespace, parseDirectiveValue, toVdom } from '../vdom';

const invalidNamespace = 'plugin.invalid';
const inheritedNamespace = 'plugin/inherited';

describe( 'namespace diagnostics', () => {
	beforeEach( () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', false );
		populateServerData( {
			state: {
				[ invalidNamespace ]: { source: 'invalid' },
				[ inheritedNamespace ]: { source: 'inherited' },
			},
			config: {
				[ invalidNamespace ]: { source: 'invalid' },
				[ inheritedNamespace ]: { source: 'inherited' },
			},
		} );
		setNamespace( inheritedNamespace );
		setScope( {
			evaluate: () => {},
			context: {
				[ invalidNamespace ]: { source: 'invalid' },
				[ inheritedNamespace ]: { source: 'inherited' },
			},
			serverContext: {
				[ invalidNamespace ]: { source: 'invalid' },
				[ inheritedNamespace ]: { source: 'inherited' },
			},
			ref: { current: null },
			attributes: {},
		} );
		logged.clear();
		vi.stubGlobal( 'SCRIPT_DEBUG', true );
	} );

	afterEach( () => {
		resetScope();
		resetNamespace();
		populateServerData( {} );
		logged.clear();
		vi.unstubAllGlobals();
	} );

	it.each( [
		[ 'store', ( namespace: string ) => store( namespace ).state ],
		[ 'getConfig', getConfig ],
		[ 'getServerState', getServerState ],
		[ 'getContext', getContext ],
		[ 'getServerContext', getServerContext ],
	] )(
		'warns in %s without changing the namespace lookup',
		( _name, read ) => {
			expect( read( invalidNamespace ) ).toEqual( { source: 'invalid' } );
			expect( console ).toHaveWarnedWith(
				expect.stringContaining(
					`Invalid namespace "${ invalidNamespace }"`
				)
			);
		}
	);

	it.each( [
		'',
		'plugin name',
		'plugin.name',
		'plugin:name',
		'plugin/é',
		'plugin\n',
		'plugin\r',
		'plugin\r\n',
		'plugin\u2028',
		'plugin\u2029',
	] )( 'warns for the unsupported namespace %j', ( namespace ) => {
		expect( store( namespace ) ).toBeDefined();
		expect( console ).toHaveWarnedWith(
			expect.stringContaining( `Invalid namespace "${ namespace }"` )
		);
	} );

	it.each( [ 'myPlugin', 'plugin-1/name_2', '0', '/', '_', '-' ] )(
		'accepts the namespace %j',
		( namespace ) => {
			expect( store( namespace ) ).toBeDefined();
			expect( getInteractiveNamespace( namespace ) ).toBe( namespace );
			expect( console ).not.toHaveWarned();
		}
	);

	it( 'keeps the implicit namespace for optional API arguments', () => {
		for ( const read of [
			getConfig,
			getServerState,
			getContext,
			getServerContext,
		] ) {
			expect( read() ).toEqual( { source: 'inherited' } );
			expect( read( undefined ) ).toEqual( { source: 'inherited' } );
		}
		const element = document.createElement( 'div' );
		expect( toVdom( element, null ) ).toBeDefined();
		expect( toVdom( element ) ).toBeDefined();
		expect( console ).not.toHaveWarned();
	} );

	it( 'warns once across entry points using the same invalid namespace', () => {
		const warn = vi.spyOn( console, 'warn' );
		store( invalidNamespace );
		getConfig( invalidNamespace );
		getInteractiveNamespace( invalidNamespace );
		expect( console ).toHaveWarnedWith(
			expect.stringContaining( 'Invalid namespace' )
		);
		expect( warn ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[ 'string', invalidNamespace ],
		[ 'object', { namespace: invalidNamespace } ],
	] )( 'warns for the %s interactive namespace form', ( _name, value ) => {
		expect( getInteractiveNamespace( value ) ).toBe( invalidNamespace );
		expect( console ).toHaveWarnedWith(
			expect.stringContaining(
				`Invalid namespace "${ invalidNamespace }"`
			)
		);
	} );

	it( 'warns for an explicit namespace passed to toVdom', () => {
		toVdom( document.createElement( 'div' ), invalidNamespace );
		expect( console ).toHaveWarnedWith(
			expect.stringContaining(
				`Invalid namespace "${ invalidNamespace }"`
			)
		);
	} );

	it.each( [
		[
			'state',
			() => populateServerData( { state: { [ invalidNamespace ]: {} } } ),
		],
		[
			'config',
			() =>
				populateServerData( { config: { [ invalidNamespace ]: {} } } ),
		],
		[
			'derived state closures',
			() =>
				populateServerData( {
					derivedStateClosures: { [ invalidNamespace ]: [] },
				} ),
		],
	] )( 'warns for namespaces in server %s', ( _name, populate ) => {
		populate();
		expect( console ).toHaveWarnedWith(
			expect.stringContaining(
				`Invalid namespace "${ invalidNamespace }"`
			)
		);
	} );

	it( 'preserves directive paths and JSON containing double colons', () => {
		expect( parseDirectiveValue( 'state.value::label' ) ).toEqual( {
			namespace: null,
			value: 'state.value::label',
		} );
		expect( parseDirectiveValue( 'plugin/state::state.value' ) ).toEqual( {
			namespace: 'plugin/state',
			value: 'state.value',
		} );
		expect( parseDirectiveValue( '{"label":"value::label"}' ) ).toEqual( {
			namespace: null,
			value: { label: 'value::label' },
		} );
		expect( parseDirectiveValue( '"value::label"' ) ).toEqual( {
			namespace: null,
			value: '"value::label"',
		} );
		expect( console ).not.toHaveWarned();
	} );

	it( 'does not warn when SCRIPT_DEBUG is false', () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', false );
		store( invalidNamespace );
		getConfig( invalidNamespace );
		getServerState( invalidNamespace );
		getContext( invalidNamespace );
		getServerContext( invalidNamespace );
		getInteractiveNamespace( invalidNamespace );
		toVdom( document.createElement( 'div' ), invalidNamespace );
		populateServerData( { config: { [ invalidNamespace ]: {} } } );
		expect( console ).not.toHaveWarned();
	} );
} );
