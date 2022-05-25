/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * Internal dependencies
 */
import { metadata, settings, name } from '../index';

/**
 * WordPress dependencies
 */
import { BlockEdit } from '@wordpress/block-editor';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

const Verse = ( { clientId, ...props } ) => (
	<BlockEdit name={ name } clientId={ clientId || 0 } { ...props } />
);

describe( 'Verse Block', () => {
	beforeAll( () => {
		registerBlockType( name, {
			...metadata,
			...settings,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( name );
	} );

	it( 'renders without crashing', () => {
		const component = render( <Verse attributes={ { content: '' } } /> );
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders given text without crashing', () => {
		const component = render(
			<Verse attributes={ { content: 'sample text' } } />
		);
		expect(
			component.getByDisplayValue( '<pre>sample text</pre>' )
		).toBeTruthy();
	} );
} );
