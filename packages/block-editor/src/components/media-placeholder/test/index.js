/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '../';

let mockDropZoneProps;

jest.mock( '@wordpress/components', () => ( {
	...jest.requireActual( '@wordpress/components' ),
	DropZone: ( props ) => {
		mockDropZoneProps = props;
		return null;
	},
} ) );

jest.mock( '../../media-upload', () => () => null );
jest.mock(
	'../../media-upload/check',
	() =>
		( { children } ) =>
			children
);
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

describe( 'MediaPlaceholder', () => {
	let mediaUpload;

	beforeEach( () => {
		mockDropZoneProps = undefined;
		mediaUpload = jest.fn();
		useSelect.mockReturnValue( {
			mediaUpload,
			allowedMimeTypes: {},
		} );
	} );

	it( 'renders successfully when allowedTypes property is not specified', () => {
		expect( () => render( <MediaPlaceholder multiple /> ) ).not.toThrow();
	} );

	it( 'selects all uploaded media when multiple upload callbacks are received individually', () => {
		const onSelect = jest.fn();
		const fileList = [
			new File( [ 'audio' ], 'first.mp3', { type: 'audio/mpeg' } ),
			new File( [ 'audio' ], 'second.mp3', { type: 'audio/mpeg' } ),
		];
		const firstTrack = {
			id: 1,
			url: 'https://example.com/first.mp3',
		};
		const secondTrack = {
			id: 2,
			url: 'https://example.com/second.mp3',
		};

		render(
			<MediaPlaceholder
				allowedTypes={ [ 'audio' ] }
				multiple
				onSelect={ onSelect }
			/>
		);

		act( () => {
			mockDropZoneProps.onFilesDrop( fileList );
		} );

		const { onFileChange } = mediaUpload.mock.calls[ 0 ][ 0 ];

		act( () => {
			onFileChange( [ firstTrack ] );
		} );

		expect( onSelect ).not.toHaveBeenCalled();

		act( () => {
			onFileChange( [ secondTrack ] );
		} );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( [ firstTrack, secondTrack ] );
	} );

	it( 'waits for final media before selecting multiple uploads', () => {
		const onSelect = jest.fn();
		const fileList = [
			new File( [ 'audio' ], 'first.mp3', { type: 'audio/mpeg' } ),
			new File( [ 'audio' ], 'second.mp3', { type: 'audio/mpeg' } ),
		];
		const firstTrack = {
			id: 1,
			url: 'https://example.com/first.mp3',
		};
		const secondTrack = {
			id: 2,
			url: 'https://example.com/second.mp3',
		};
		const firstBlob = {
			url: 'blob:https://example.com/first',
		};
		const secondBlob = {
			url: 'blob:https://example.com/second',
		};

		render(
			<MediaPlaceholder
				allowedTypes={ [ 'audio' ] }
				multiple
				onSelect={ onSelect }
			/>
		);

		act( () => {
			mockDropZoneProps.onFilesDrop( fileList );
		} );

		const { onFileChange } = mediaUpload.mock.calls[ 0 ][ 0 ];

		act( () => {
			onFileChange( [ firstBlob, secondBlob ] );
		} );

		expect( onSelect ).not.toHaveBeenCalled();

		act( () => {
			onFileChange( [ firstTrack, secondBlob ] );
		} );

		expect( onSelect ).not.toHaveBeenCalled();

		act( () => {
			onFileChange( [ firstTrack, secondTrack ] );
		} );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( [ firstTrack, secondTrack ] );
	} );

	it( 'preserves file order when multiple upload callbacks finish out of order', () => {
		const onSelect = jest.fn();
		const fileList = [
			new File( [ 'audio' ], 'first.mp3', { type: 'audio/mpeg' } ),
			new File( [ 'audio' ], 'second.mp3', { type: 'audio/mpeg' } ),
		];
		const firstTrack = {
			id: 1,
			filename: 'first.mp3',
			url: 'https://example.com/first.mp3',
		};
		const secondTrack = {
			id: 2,
			filename: 'second.mp3',
			url: 'https://example.com/second.mp3',
		};

		render(
			<MediaPlaceholder
				allowedTypes={ [ 'audio' ] }
				multiple
				onSelect={ onSelect }
			/>
		);

		act( () => {
			mockDropZoneProps.onFilesDrop( fileList );
		} );

		const { onBatchSuccess, onFileChange } =
			mediaUpload.mock.calls[ 0 ][ 0 ];

		act( () => {
			onFileChange( [ { url: 'blob:https://example.com/first' } ] );
			onFileChange( [ { url: 'blob:https://example.com/second' } ] );
			onFileChange( [ secondTrack ] );
			onFileChange( [ firstTrack ] );
			onBatchSuccess();
		} );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( [ firstTrack, secondTrack ] );
	} );

	it( 'preserves file order when final media filenames are sanitized', () => {
		const onSelect = jest.fn();
		const fileList = [
			new File( [ 'audio' ], 'First Track.mp3', {
				type: 'audio/mpeg',
			} ),
			new File( [ 'audio' ], 'Second Track.mp3', {
				type: 'audio/mpeg',
			} ),
		];
		const firstTrack = {
			id: 1,
			filename: 'first-track-1.mp3',
			url: 'https://example.com/first-track-1.mp3',
		};
		const secondTrack = {
			id: 2,
			filename: 'second-track-1.mp3',
			url: 'https://example.com/second-track-1.mp3',
		};

		render(
			<MediaPlaceholder
				allowedTypes={ [ 'audio' ] }
				multiple
				onSelect={ onSelect }
			/>
		);

		act( () => {
			mockDropZoneProps.onFilesDrop( fileList );
		} );

		const { onBatchSuccess, onFileChange } =
			mediaUpload.mock.calls[ 0 ][ 0 ];

		act( () => {
			onFileChange( [ { url: 'blob:https://example.com/first' } ] );
			onFileChange( [ { url: 'blob:https://example.com/second' } ] );
			onFileChange( [ secondTrack ] );
			onFileChange( [ firstTrack ] );
			onBatchSuccess();
		} );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( [ firstTrack, secondTrack ] );
	} );

	it( 'selects successful media when a multiple upload partially fails without a batch success callback', () => {
		const onError = jest.fn();
		const onSelect = jest.fn();
		const fileList = [
			new File( [ 'audio' ], 'first.mp3', { type: 'audio/mpeg' } ),
			new File( [ 'audio' ], 'second.mp3', { type: 'audio/mpeg' } ),
		];
		const firstTrack = {
			id: 1,
			filename: 'first.mp3',
			url: 'https://example.com/first.mp3',
		};
		const secondBlob = {
			url: 'blob:https://example.com/second',
		};

		render(
			<MediaPlaceholder
				allowedTypes={ [ 'audio' ] }
				multiple
				onError={ onError }
				onSelect={ onSelect }
			/>
		);

		act( () => {
			mockDropZoneProps.onFilesDrop( fileList );
		} );

		const { onError: onUploadError, onFileChange } =
			mediaUpload.mock.calls[ 0 ][ 0 ];

		act( () => {
			onFileChange( [ firstTrack, secondBlob ] );
			onFileChange( [ firstTrack ] );
			onUploadError( 'The second file could not be uploaded.' );
		} );

		expect( onError ).toHaveBeenCalledWith(
			'The second file could not be uploaded.'
		);
		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( [ firstTrack ] );
	} );
} );
