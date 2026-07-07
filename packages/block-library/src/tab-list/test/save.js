/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { metadata, settings } from '../index';

describe( 'tab-list save', () => {
	beforeAll( () => {
		registerBlockType( metadata, settings );
	} );

	afterAll( () => {
		unregisterBlockType( metadata.name );
	} );

	it( 'serializes aria-label on the tablist wrapper', () => {
		const block = createBlock( 'core/tab-list', {
			ariaLabel: 'Product details',
			tabs: [ { label: 'Description' }, { label: 'Reviews' } ],
		} );

		const serialized = serialize( block );

		expect( serialized ).toContain(
			'<div role="tablist" aria-label="Product details" class="wp-block-tab-list">'
		);
	} );
} );
