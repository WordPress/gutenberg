import { describe, expect, it, vi } from 'vitest';
import { registerEntityField, unregisterEntityField } from '../api';

const actions = vi.hoisted( () => ( {
	registerEntityField: vi.fn(),
	unregisterEntityField: vi.fn(),
} ) );

vi.mock( '@wordpress/data', () => ( { dispatch: () => actions } ) );
vi.mock( '../../lock-unlock', () => ( { unlock: ( value ) => value } ) );
vi.mock( '../../store', () => ( { store: {} } ) );

describe( 'registerEntityField', () => {
	it( 'is deprecated but still registers the field', () => {
		const field = { id: 'acme/rating' };

		registerEntityField( 'postType', 'post', field );

		expect( console ).toHaveWarnedWith(
			'wp.editor.registerEntityField is deprecated since version 24.2. Please use the `fields_api_init` PHP action instead.'
		);
		expect( actions.registerEntityField ).toHaveBeenCalledWith(
			'postType',
			'post',
			field
		);
	} );
} );

describe( 'unregisterEntityField', () => {
	it( 'is deprecated but still unregisters the field', () => {
		unregisterEntityField( 'postType', 'post', 'acme/rating' );

		expect( console ).toHaveWarnedWith(
			'wp.editor.unregisterEntityField is deprecated since version 24.2. Please use the `fields_api_init` PHP action instead.'
		);
		expect( actions.unregisterEntityField ).toHaveBeenCalledWith(
			'postType',
			'post',
			'acme/rating'
		);
	} );
} );
