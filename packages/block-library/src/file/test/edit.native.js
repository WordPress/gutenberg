/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { MediaUploadProgress } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { FileEdit } from '../edit.native.js';

const getTestComponentWithContent = ( attributes = {} ) => {
	return renderer.create(
		<FileEdit
			attributes={ attributes }
			setAttributes={ jest.fn() }
			getMedia={ jest.fn() }
			getStylesFromColorScheme={ jest.fn() }
		/>
	);
};

describe( 'File block', () => {
	it( 'renders placeholder without crashing', () => {
		const component = getTestComponentWithContent();
		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders file without crashing', () => {
		const component = getTestComponentWithContent( {
			showDownloadButton: true,
			downloadButtonText: 'Download',
			href: 'https://wordpress.org/latest.zip',
			fileName: 'File name',
			textLinkHref: 'https://wordpress.org/latest.zip',
			id: '1',
		} );

		component
			.getInstance()
			.onLayout( { nativeEvent: { layout: { width: 100 } } } );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );

	it( 'renders file error state without crashing', () => {
		const component = getTestComponentWithContent( {
			showDownloadButton: true,
			downloadButtonText: 'Download',
			href: 'https://wordpress.org/latest.zip',
			fileName: 'File name',
			textLinkHref: 'https://wordpress.org/latest.zip',
			id: '1',
		} );
		component
			.getInstance()
			.onLayout( { nativeEvent: { layout: { width: 100 } } } );

		const mediaUpload = component.root.findByType( MediaUploadProgress );
		mediaUpload.instance.finishMediaUploadWithFailure( { mediaId: -1 } );

		const rendered = component.toJSON();
		expect( rendered ).toMatchSnapshot();
	} );
} );
