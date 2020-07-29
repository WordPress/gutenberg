/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Verse from '../edit';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

describe( 'Verse Block', () => {
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
