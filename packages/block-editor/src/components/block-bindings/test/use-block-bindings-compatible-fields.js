/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	registerBlockBindingsSource,
	unregisterBlockBindingsSource,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useBlockBindingsCompatibleFields } from '../';

const BLOCK_NAME = 'core/test-bindable';
const ENUM_BLOCK_NAME = 'core/test-enum';
const SOURCE_STRING = 'test/string-source';
const SOURCE_NUMBER = 'test/number-source';

const STRING_FIELDS = [
	{ key: 'one', label: 'One', type: 'string' },
	{ key: 'two', label: 'Two', type: 'string' },
];
const MIXED_FIELDS = [
	{ key: 'num', label: 'Num', type: 'integer' },
	{ key: 'str', label: 'Str', type: 'string' },
];

function registerSources() {
	registerBlockBindingsSource( {
		name: SOURCE_STRING,
		label: 'String source',
		getFieldsList: () => STRING_FIELDS,
	} );
	registerBlockBindingsSource( {
		name: SOURCE_NUMBER,
		label: 'Number source',
		getFieldsList: () => MIXED_FIELDS,
	} );
}

function unregisterSources() {
	unregisterBlockBindingsSource( SOURCE_STRING );
	unregisterBlockBindingsSource( SOURCE_NUMBER );
}

function registerBindableBlock() {
	registerBlockType( BLOCK_NAME, {
		apiVersion: 3,
		title: 'Test bindable',
		category: 'text',
		attributes: {
			content: { type: 'rich-text' },
			label: { type: 'string' },
		},
		save: () => null,
	} );
}

function registerEnumBlock() {
	registerBlockType( ENUM_BLOCK_NAME, {
		apiVersion: 3,
		title: 'Test enum',
		category: 'text',
		attributes: {
			level: { type: 'string', enum: [ 'a', 'b' ] },
		},
		save: () => null,
	} );
}

describe( 'useBlockBindingsCompatibleFields', () => {
	// Track all hooks rendered in a test so we can unmount them in afterEach.
	// `useSelect` subscribes to the data registry; if a hook stays mounted,
	// subsequent dispatches in afterEach fire state updates outside any act()
	// scope, which Jest's strict-console plugin flags as unwrapped errors.
	let activeHooks;

	function renderTrackedHook( callback ) {
		const utils = renderHook( callback );
		activeHooks.push( utils );
		return utils;
	}

	beforeEach( () => {
		activeHooks = [];
		registerSources();
		registerBindableBlock();
		registerEnumBlock();
		dispatch( blockEditorStore ).updateSettings( {
			__experimentalBlockBindingsSupportedAttributes: {
				[ BLOCK_NAME ]: [ 'content', 'label' ],
				[ ENUM_BLOCK_NAME ]: [ 'level' ],
				'core/post-date': [ 'date' ],
			},
			canUpdateBlockBindings: true,
		} );
	} );

	afterEach( () => {
		// Unmount all subscribed hooks BEFORE we dispatch unwind updates so
		// the data store does not trigger renders on an unmounted tree.
		activeHooks.forEach( ( handle ) => handle.unmount() );
		activeHooks = [];

		unregisterBlockType( BLOCK_NAME );
		unregisterBlockType( ENUM_BLOCK_NAME );
		unregisterSources();
		dispatch( blockEditorStore ).updateSettings( {
			__experimentalBlockBindingsSupportedAttributes: undefined,
			canUpdateBlockBindings: undefined,
		} );
	} );

	it( 'returns isBindable=false when attribute is enum-typed', () => {
		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'level', ENUM_BLOCK_NAME, {} )
		);
		expect( result.current ).toEqual( {
			isBindable: false,
			compatibleFields: {},
		} );
	} );

	it( 'coerces rich-text attribute type to string when matching field types', () => {
		// `content` is `rich-text` so it should match string-typed fields.
		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'content', BLOCK_NAME, {} )
		);
		expect( result.current.isBindable ).toBe( true );
		expect( result.current.compatibleFields[ SOURCE_STRING ] ).toEqual(
			STRING_FIELDS
		);
	} );

	it( 'filters fields by attribute type and omits sources with zero compatible fields', () => {
		// `label` is `string`. SOURCE_STRING contributes 2 string fields.
		// SOURCE_NUMBER has one integer + one string field; only the string
		// field should be kept.
		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'label', BLOCK_NAME, {} )
		);
		expect( result.current.isBindable ).toBe( true );
		expect( Object.keys( result.current.compatibleFields ) ).toEqual( [
			SOURCE_STRING,
			SOURCE_NUMBER,
		] );
		expect( result.current.compatibleFields[ SOURCE_NUMBER ] ).toEqual( [
			{ key: 'str', label: 'Str', type: 'string' },
		] );
	} );

	it( 'returns isBindable=false when attribute is not in __experimentalBlockBindingsSupportedAttributes', () => {
		act( () => {
			dispatch( blockEditorStore ).updateSettings( {
				__experimentalBlockBindingsSupportedAttributes: {},
			} );
		} );
		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'content', BLOCK_NAME, {} )
		);
		expect( result.current.isBindable ).toBe( false );
	} );

	it( 'returns isBindable=false for blocks in BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS', () => {
		// Register a faux core/post-date so getBlockType resolves it.
		// The unregister happens in afterAll below (see end of file) so the
		// state change does not fire on a still-mounted subscribed hook.
		registerBlockType( 'core/post-date', {
			apiVersion: 3,
			title: 'Post date',
			category: 'text',
			attributes: { date: { type: 'string' } },
			save: () => null,
		} );

		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'date', 'core/post-date', {} )
		);
		expect( result.current.isBindable ).toBe( false );
	} );

	afterAll( () => {
		// Defensive: ensure the excluded-block test's registration is cleaned
		// up even though the test itself does not unregister.
		try {
			unregisterBlockType( 'core/post-date' );
		} catch {
			// Not registered — nothing to do.
		}
	} );

	it( 'returns isBindable=false when canUpdateBlockBindings is false', () => {
		act( () => {
			dispatch( blockEditorStore ).updateSettings( {
				canUpdateBlockBindings: false,
			} );
		} );
		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'content', BLOCK_NAME, {} )
		);
		expect( result.current.isBindable ).toBe( false );
		// `compatibleFields` is still computed (used by the legacy panel UI).
		expect( result.current.compatibleFields[ SOURCE_STRING ] ).toEqual(
			STRING_FIELDS
		);
	} );

	it( 'returns isBindable=true with the compatible-fields map when all gates pass', () => {
		const { result } = renderTrackedHook( () =>
			useBlockBindingsCompatibleFields( 'content', BLOCK_NAME, {} )
		);
		expect( result.current.isBindable ).toBe( true );
		expect( Object.keys( result.current.compatibleFields ) ).toContain(
			SOURCE_STRING
		);
	} );
} );
