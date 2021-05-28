/**
 * External dependencies
 */
import { act, create } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { MediaUploadProgress, BlockEdit } from '@wordpress/block-editor';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { metadata, settings, name } from '../index';

const AudioEdit = ( { clientId, ...props } ) => (
	<BlockEdit name={ name } clientId={ clientId || 0 } { ...props } />
);

const getTestComponentWithContent = ( attributes = {} ) => {
	return create(
		<AudioEdit attributes={ attributes } setAttributes={ jest.fn() } />
	);
};

describe( 'Audio block', () => {
	beforeAll( () => {
		registerBlockType( name, {
			...metadata,
			...settings,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( name );
	} );

	it( 'renders placeholder without crashing', () => {
		const component = getTestComponentWithContent();
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders audio file without crashing', () => {
		const component = getTestComponentWithContent( {
			src: 'https://cldup.com/59IrU0WJtq.mp3',
			id: '1',
		} );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders audio block error state without crashing', () => {
		const component = getTestComponentWithContent( {
			src: 'https://cldup.com/59IrU0WJtq.mp3',
			id: '1',
		} );

		const mediaUpload = component.root.findByType( MediaUploadProgress );

		act( () => {
			mediaUpload.instance.finishMediaUploadWithFailure( {
				mediaId: -1,
			} );
		} );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );
} );
