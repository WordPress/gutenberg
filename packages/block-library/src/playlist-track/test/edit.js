import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	BlockContextProvider,
	BlockControls,
	BlockEdit,
	BlockEditorProvider,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlobURL } from '@wordpress/blob';
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { useLayoutEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { PlaylistContext } from '../../playlist/context';

const MEDIA_UPLOAD_FILTER = 'core/playlist-track/test/media-upload';

const defaultAttributes = {
	id: 1,
	src: 'https://example.com/song.mp3',
	album: 'Great Album',
	artist: 'The Artist',
	image: 'https://example.com/cover.jpg',
	imageAlt: 'A bright abstract track image',
	length: '3:45',
	title: 'Song One',
};

function MediaUploadSettings( { mediaUpload } ) {
	const { updateSettings } = useDispatch( blockEditorStore );

	useLayoutEffect( () => {
		updateSettings( { mediaUpload } );
	}, [ mediaUpload, updateSettings ] );

	return null;
}

function addMediaUploadFilter( media ) {
	addFilter(
		'editor.MediaUpload',
		MEDIA_UPLOAD_FILTER,
		() =>
			function TestMediaUpload( {
				render: renderMediaUpload,
				onSelect,
			} ) {
				return renderMediaUpload( {
					open: () => onSelect( media ),
				} );
			}
	);
}

function renderEdit( props = {} ) {
	const setAttributes = jest.fn();
	const setCurrentTrackClientId = props.setCurrentTrackClientId || jest.fn();
	const mediaUpload = props.mediaUpload || jest.fn();

	render(
		<BlockEditorProvider
			value={ [] }
			onInput={ jest.fn() }
			onChange={ jest.fn() }
			settings={ {
				mediaUpload,
			} }
		>
			<MediaUploadSettings mediaUpload={ mediaUpload } />
			<PlaylistContext.Provider
				value={ {
					currentTrackClientId: props.currentTrackClientId ?? null,
					setCurrentTrackClientId,
				} }
			>
				<BlockContextProvider
					value={ {
						showArtists: true,
						showImages: true,
						...props.context,
					} }
				>
					<BlockEdit
						name="core/playlist-track"
						attributes={ {
							...defaultAttributes,
							...props.attributes,
						} }
						setAttributes={ setAttributes }
						clientId={
							props.clientId || 'playlist-track-client-id'
						}
						isSelected={ props.isSelected ?? false }
						mayDisplayControls
					/>
					<BlockControls.Slot group="other" />
					<InspectorControls.Slot />
				</BlockContextProvider>
			</PlaylistContext.Provider>
		</BlockEditorProvider>
	);

	return { mediaUpload, setAttributes, setCurrentTrackClientId };
}

describe( 'PlaylistTrackEdit', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterEach( () => {
		removeFilter( 'editor.MediaUpload', MEDIA_UPLOAD_FILTER );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it( 'allows the track image alternative text to be edited', () => {
		const { setAttributes } = renderEdit();

		expect(
			screen.getByRole( 'link', {
				name: /Describe the purpose of the image\./,
			} )
		).toHaveAttribute(
			'href',
			'https://www.w3.org/WAI/tutorials/images/decision-tree/'
		);
		expect(
			screen.queryByText( 'Leave empty if decorative.' )
		).not.toBeInTheDocument();

		fireEvent.change( screen.getByLabelText( 'Alternative text' ), {
			target: { value: 'A silver microphone on a red background' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			imageAlt: 'A silver microphone on a red background',
		} );
	} );

	it( 'does not show the alternative text control without a track image', () => {
		renderEdit( {
			attributes: {
				image: undefined,
				imageAlt: undefined,
			},
		} );

		expect(
			screen.queryByLabelText( 'Alternative text' )
		).not.toBeInTheDocument();
	} );

	it( 'sets the selected track as the current track', () => {
		const { setCurrentTrackClientId } = renderEdit( {
			currentTrackClientId: 'another-track-client-id',
			isSelected: true,
		} );

		expect( setCurrentTrackClientId ).toHaveBeenCalledWith(
			'playlist-track-client-id'
		);
	} );

	it( 'does not set a selected placeholder track as the current track', () => {
		const { setCurrentTrackClientId } = renderEdit( {
			attributes: {
				blob: undefined,
				src: undefined,
			},
			currentTrackClientId: 'another-track-client-id',
			isSelected: true,
		} );

		expect( setCurrentTrackClientId ).not.toHaveBeenCalled();
	} );

	it( 'uploads temporary blob tracks', async () => {
		const originalCreateObjectURL = window.URL.createObjectURL;
		window.URL.createObjectURL = jest.fn( () => 'blob:temporary-track' );
		const file = new File( [ 'audio' ], 'temporary-track.mp3', {
			type: 'audio/mpeg',
		} );
		const temporaryURL = createBlobURL( file );
		const mediaUpload = jest.fn();

		renderEdit( {
			attributes: {
				blob: temporaryURL,
				length: undefined,
				src: undefined,
			},
			mediaUpload,
		} );

		try {
			await waitFor( () =>
				expect( mediaUpload ).toHaveBeenCalledWith(
					expect.objectContaining( {
						allowedTypes: [ 'audio' ],
						filesList: [ file ],
					} )
				)
			);
			const trackButton = screen.getByRole( 'button', {
				name: /Song One/,
			} );

			expect(
				within( trackButton ).getByRole( 'presentation', {
					hidden: true,
				} )
			).toBeInTheDocument();
		} finally {
			window.URL.createObjectURL = originalCreateObjectURL;
		}
	} );

	it( 'preserves the current track source when a replacement upload fails', async () => {
		addMediaUploadFilter();
		const { setAttributes } = renderEdit();

		const user = userEvent.setup();
		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);
		await user.click(
			screen.getByRole( 'menuitem', {
				name: 'Open Media Library',
			} )
		);

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty(
			'src'
		);
	} );

	it( 'accepts raw uploaded attachment data when replacing a track', async () => {
		addMediaUploadFilter( {
			id: 2,
			source_url: 'https://example.com/replacement.mp3',
			title: { raw: 'Replacement &amp; Track' },
		} );
		const { setAttributes } = renderEdit();

		const user = userEvent.setup();
		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);
		await user.click(
			screen.getByRole( 'menuitem', {
				name: 'Open Media Library',
			} )
		);

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( {
				blob: undefined,
				id: 2,
				src: 'https://example.com/replacement.mp3',
				title: 'Replacement & Track',
			} )
		);
	} );
} );
