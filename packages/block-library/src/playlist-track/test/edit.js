import { fireEvent, render, screen, within } from '@testing-library/react';
import { useDispatch } from '@wordpress/data';
import PlaylistTrackEdit from '../edit';
import { PlaylistContext } from '../../playlist/context';
import { useUploadMediaFromBlobURL } from '../../utils/hooks';

let mockMediaReplaceFlowProps;

jest.mock( '@wordpress/block-editor', () => {
	const PlainText = jest.requireActual(
		'../../../../block-editor/src/components/plain-text'
	).default;

	return {
		store: 'core/block-editor',
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
			renderMediaUpload( { open: jest.fn() } ),
		MediaUploadCheck: ( { children } ) => <div>{ children }</div>,
		PlainText,
		useBlockProps: jest.fn( ( props = {} ) => ( {
			'data-testid': 'playlist-track-block',
			tabIndex: 0,
			...props,
		} ) ),
	};
} );

jest.mock( '@wordpress/data', () => {
	const data = jest.requireActual( '@wordpress/data' );
	const mockUseDispatch = jest.fn();

	return new Proxy( data, {
		get( target, property ) {
			if ( property === 'useDispatch' ) {
				return mockUseDispatch;
			}

			return target[ property ];
		},
	} );
} );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '../../utils/hooks', () => ( {
	useUploadMediaFromBlobURL: jest.fn(),
} ) );

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
	const setAttributes = jest.fn();
	const setCurrentTrackClientId = props.setCurrentTrackClientId || jest.fn();
	const selectBlock = props.selectBlock || jest.fn();

	useDispatch.mockImplementation( ( store ) => {
		if ( store === 'core/block-editor' ) {
			return {
				selectBlock,
			};
		}

		return {
			createErrorNotice: jest.fn(),
		};
	} );

	render(
		<PlaylistContext.Provider
			value={ {
				currentTrackClientId: props.currentTrackClientId ?? null,
				setCurrentTrackClientId,
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

	return {
		selectBlock,
		setAttributes,
		setCurrentTrackClientId,
	};
}

describe( 'PlaylistTrackEdit', () => {
	beforeEach( () => {
		mockMediaReplaceFlowProps = undefined;
		useDispatch.mockReset();
		useUploadMediaFromBlobURL.mockClear();
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

	it( 'selects and focuses the track block when the duration safe area is clicked', () => {
		const selectBlock = jest.fn();
		const { setCurrentTrackClientId } = renderEdit( { selectBlock } );
		const duration = screen.getByText( '3:45' );

		fireEvent.click( duration );

		expect( setCurrentTrackClientId ).toHaveBeenCalledWith(
			'playlist-track-client-id'
		);
		expect( selectBlock ).toHaveBeenCalledWith(
			'playlist-track-client-id'
		);
		expect( screen.getByTestId( 'playlist-track-block' ) ).toHaveFocus();
	} );

	it( 'does not select the track block when editable track content is clicked', () => {
		const selectBlock = jest.fn();
		const { setCurrentTrackClientId } = renderEdit( { selectBlock } );

		fireEvent.click( screen.getByLabelText( 'Track title' ) );

		expect( setCurrentTrackClientId ).toHaveBeenCalledWith(
			'playlist-track-client-id'
		);
		expect( selectBlock ).not.toHaveBeenCalled();
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

	it( 'preserves the current track source when a replacement upload fails', () => {
		const { setAttributes } = renderEdit();

		mockMediaReplaceFlowProps.onSelect();

		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty(
			'src'
		);
	} );

	it( 'accepts raw uploaded attachment data when replacing a track', () => {
		const { setAttributes } = renderEdit();

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
