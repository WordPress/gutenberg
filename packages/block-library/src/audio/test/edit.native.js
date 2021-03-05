/**
 * External dependencies
 */
import { act, create } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { MediaUploadProgress } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AudioEdit from '../edit.native.js';

const getTestComponentWithContent = ( attributes = {} ) => {
	return create(
		<AudioEdit attributes={ attributes } setAttributes={ jest.fn() } />
	);
};

describe( 'Audio block', () => {
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
