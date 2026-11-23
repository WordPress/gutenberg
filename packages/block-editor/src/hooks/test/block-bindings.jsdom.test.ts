import { afterEach, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import blockBindings from '../block-bindings';

function registerBlock( name: string, attribute: string, type: string ) {
	registerBlockType( name, {
		apiVersion: 3,
		title: name,
		category: 'text',
		attributes: { [ attribute ]: { type } },
		save: () => null,
	} );
}

describe( 'block bindings hasSupport', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it( 'is false for Date and Navigation Link when the server registers their types as string', () => {
		registerBlock( 'core/post-date', 'datetime', 'string' );
		registerBlock( 'core/navigation-link', 'url', 'string' );

		expect( blockBindings.hasSupport( 'core/post-date' ) ).toBe( false );
		expect( blockBindings.hasSupport( 'core/navigation-link' ) ).toBe(
			false
		);
	} );

	it( 'is true for Date and Navigation Link with the datetime and url types', () => {
		registerBlock( 'core/post-date', 'datetime', 'datetime' );
		registerBlock( 'core/navigation-link', 'url', 'url' );

		expect( blockBindings.hasSupport( 'core/post-date' ) ).toBe( true );
		expect( blockBindings.hasSupport( 'core/navigation-link' ) ).toBe(
			true
		);
	} );

	it( 'is true for other blocks', () => {
		expect( blockBindings.hasSupport( 'core/paragraph' ) ).toBe( true );
	} );
} );
