import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useDispatch } from '@wordpress/data';
import PlaylistTrackEdit from '../edit';
import { PlaylistContext } from '../../playlist/context';
import { useUploadMediaFromBlobURL } from '../../utils/hooks';
import { queueTrackPeaks } from '../../utils/waveform-peaks';

let mockMediaReplaceFlowProps;

vi.mock( '@wordpress/block-editor', async () => {
	const { default: PlainText } =
		await import( '../../../../block-editor/src/components/plain-text' );

	return {
		BlockControls: ( { children } ) => <div>{ children }</div>,
		BlockIcon: () => <span />,
		InspectorControls: ( { children } ) => <div>{ children }</div>,
		MediaPlaceholder: () => <div />,
		MediaReplaceFlow: ( props ) => {
			mockMediaReplaceFlowProps = props;
			const { name, onSelect } = props;
			return <button onClick={ () => onSelect( {} ) }>{ name }</button>;
		},
		MediaUpload: ( { render: renderMediaUpload } ) =>
			renderMediaUpload( { open: vi.fn() } ),
		MediaUploadCheck: ( { children } ) => <div>{ children }</div>,
		PlainText,
		useBlockProps: vi.fn( () => ( {} ) ),
	};
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const data = await importOriginal();
	const mockUseDispatch = vi.fn();

	return new Proxy( data, {
		get( target, property ) {
			if ( property === 'useDispatch' ) {
				return mockUseDispatch;
			}

			return target[ property ];
		},
	} );
} );

vi.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

vi.mock( '../../utils/hooks', () => ( {
	useUploadMediaFromBlobURL: vi.fn(),
} ) );

vi.mock( '../../utils/waveform-peaks', () => ( {
	queueTrackPeaks: vi.fn( () => Promise.resolve( null ) ),
} ) );

// The handler only forwards the message to a notice, so its text is
// irrelevant to what these tests check.
const UPLOAD_ERROR = 'Upload failed.';

/**
 * Let the queued waveform analysis settle.
 *
 * @return {Promise<void>} Resolves once pending promises have run.
 */
function flushAnalysis() {
	return act( async () => {
		await Promise.resolve();
	} );
}

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

function renderEdit( props = {} ) {
	const setAttributes = vi.fn();
	const setCurrentTrackClientId = props.setCurrentTrackClientId || vi.fn();
	const removeTrack = props.removeTrack || vi.fn();

	render(
		<PlaylistContext.Provider
			value={ {
				currentTrackClientId: props.currentTrackClientId ?? null,
				setCurrentTrackClientId,
				removeTrack,
			} }
		>
			<PlaylistTrackEdit
				attributes={ {
					...defaultAttributes,
					...props.attributes,
				} }
				setAttributes={ setAttributes }
				context={ {
					showArtists: true,
					showImages: true,
					...props.context,
				} }
				clientId={ props.clientId || 'playlist-track-client-id' }
				isSelected={ props.isSelected ?? false }
			/>
		</PlaylistContext.Provider>
	);

	return { setAttributes, setCurrentTrackClientId, removeTrack };
}

describe( 'PlaylistTrackEdit', () => {
	beforeEach( () => {
		mockMediaReplaceFlowProps = undefined;
		useDispatch.mockReturnValue( {
			createErrorNotice: vi.fn(),
		} );
		useUploadMediaFromBlobURL.mockClear();
	} );

	it( 'shows the title control for a single selected playlist track', () => {
		renderEdit( { isSelected: true } );

		expect(
			screen.getByRole( 'textbox', { name: 'Title' } )
		).toBeInTheDocument();
	} );

	it( 'shows the replace track control for a single selected playlist track', () => {
		renderEdit( { isSelected: true } );

		expect( mockMediaReplaceFlowProps ).toBeDefined();
	} );

	it( 'does not show the replace track control when multiple playlist tracks are selected', () => {
		renderEdit( { isSelected: false } );

		expect( mockMediaReplaceFlowProps ).toBeUndefined();
	} );

	it( 'does not show the title control when multiple playlist tracks are selected', () => {
		// The track inspector only renders for the selected block, or for the
		// first block of a same-type multi-selection, where `isSelected` is
		// false.
		renderEdit( { isSelected: false } );

		expect(
			screen.queryByRole( 'textbox', { name: 'Title' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: 'Artist' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: 'Album' } )
		).toBeInTheDocument();
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

	it( 'uploads temporary blob tracks', () => {
		renderEdit( {
			attributes: {
				blob: 'blob:https://example.com/temporary-track',
				length: undefined,
				src: undefined,
			},
		} );

		expect( useUploadMediaFromBlobURL ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: 'blob:https://example.com/temporary-track',
			} )
		);
		const trackButton = screen.getByRole( 'button', {
			name: /Song One/,
		} );

		expect(
			within( trackButton ).getByRole( 'presentation', { hidden: true } )
		).toBeInTheDocument();
	} );

	it( 'removes the track when its initial upload fails', () => {
		const createErrorNotice = vi.fn();
		const removeBlock = vi.fn();
		useDispatch.mockReturnValue( { createErrorNotice, removeBlock } );

		const { removeTrack } = renderEdit( {
			attributes: {
				blob: 'blob:https://example.com/temporary-track',
				id: undefined,
				length: undefined,
				src: undefined,
			},
			clientId: 'temporary-track',
		} );

		const { onError } = useUploadMediaFromBlobURL.mock.calls[ 0 ][ 0 ];
		act( () => {
			onError( UPLOAD_ERROR );
		} );

		expect( createErrorNotice ).toHaveBeenCalled();
		// The playlist owns its inner blocks: removing the track directly
		// would take an unmodified playlist with it.
		expect( removeTrack ).toHaveBeenCalledWith( 'temporary-track' );
		expect( removeBlock ).not.toHaveBeenCalled();
	} );

	// `onUploadError` also fires when replacing an existing track's media, so
	// removing the block unconditionally would discard the original track.
	it( 'keeps a track that already has a source when an upload fails', () => {
		const createErrorNotice = vi.fn();
		const removeBlock = vi.fn();
		useDispatch.mockReturnValue( { createErrorNotice, removeBlock } );

		const { setAttributes } = renderEdit( {
			clientId: 'existing-track',
			isSelected: true,
		} );

		// A failed replacement is reported by MediaReplaceFlow, not the
		// blob uploader, which never runs for a track that has a source.
		act( () => {
			mockMediaReplaceFlowProps.onError( UPLOAD_ERROR );
		} );

		expect( createErrorNotice ).toHaveBeenCalled();
		expect( removeBlock ).not.toHaveBeenCalled();
		// The original track is left untouched, so its source still plays.
		expect( setAttributes ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'button', { name: /Song One/ } )
		).toBeInTheDocument();
	} );

	it( 'preserves the current track source when a replacement upload fails', () => {
		const { setAttributes } = renderEdit( { isSelected: true } );

		mockMediaReplaceFlowProps.onSelect();

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty(
			'src'
		);
	} );

	it( 'stores the analysed waveform on the track', async () => {
		queueTrackPeaks.mockResolvedValueOnce( 'QUFB' );

		const { setAttributes } = renderEdit( {
			attributes: { waveform: undefined },
		} );

		await flushAnalysis();

		expect( queueTrackPeaks ).toHaveBeenCalledWith(
			'https://example.com/song.mp3'
		);
		expect( setAttributes ).toHaveBeenCalledWith( { waveform: 'QUFB' } );
	} );

	it( 'does not re-analyse a track that already has a waveform', async () => {
		renderEdit( { attributes: { waveform: 'QUFB' } } );

		await flushAnalysis();

		expect( queueTrackPeaks ).not.toHaveBeenCalled();
	} );

	it( 'leaves the track alone when the audio cannot be analysed', async () => {
		// Cross-origin media without CORS headers cannot be read, so there are
		// no peaks to store. The track still plays.
		queueTrackPeaks.mockResolvedValueOnce( null );

		const { setAttributes } = renderEdit( {
			attributes: { waveform: undefined },
		} );

		await flushAnalysis();

		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'clears the stored waveform when the track media is replaced', async () => {
		// getTrackAttributes() is spread over the existing attributes, so a
		// waveform left out of it would stay behind and be drawn over the
		// incoming audio.
		const { setAttributes } = renderEdit( {
			isSelected: true,
			attributes: { waveform: 'QUFB' },
		} );

		await act( async () => {
			mockMediaReplaceFlowProps.onSelect( {
				id: 2,
				source_url: 'https://example.com/replacement.mp3',
				title: { raw: 'Replacement' },
			} );
		} );

		const attributes = setAttributes.mock.calls[ 0 ][ 0 ];

		expect( 'waveform' in attributes ).toBe( true );
		expect( attributes.waveform ).toBeUndefined();
	} );

	it( 'accepts raw uploaded attachment data when replacing a track', () => {
		const { setAttributes } = renderEdit( { isSelected: true } );

		mockMediaReplaceFlowProps.onSelect( {
			id: 2,
			source_url: 'https://example.com/replacement.mp3',
			title: { raw: 'Replacement &amp; Track' },
		} );

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
