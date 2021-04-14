/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { metadata, settings, name } from '../index';

/**
 * WordPress dependencies
 */
import { RichText, BlockEdit } from '@wordpress/block-editor';
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
		const component = renderer.create(
			<Verse attributes={ { content: '' } } />
		);
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders given text without crashing', () => {
		const component = renderer.create(
			<Verse attributes={ { content: 'sample text' } } />
		);
		const testInstance = component.root;
		const richText = testInstance.findByType( RichText );
		expect( richText ).toBeTruthy();
		expect( richText.props.value ).toBe( 'sample text' );
	} );
} );
