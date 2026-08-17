import { fireEvent, render, screen, within } from '@testing-library/react';
import { useDispatch } from '@wordpress/data';
import PlaylistTrackEdit from '../edit';
import { PlaylistContext } from '../../playlist/context';
import { useUploadMediaFromBlobURL } from '../../utils/hooks';

let mockMediaReplaceFlowProps;

jest.mock( '@wordpress/block-editor', () => ( {
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
	PlainText: ( {
		onChange,
		placeholder,
		tagName: TagName = 'div',
		value,
		__experimentalVersion,
		...props
	} ) => <TagName { ...props }>{ value || placeholder }</TagName>,
	useBlockProps: jest.fn( () => ( {} ) ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	combineReducers: jest.fn( ( reducers ) => ( state = {}, action ) => {
		const newState = {};
		Object.keys( reducers ).forEach( ( key ) => {
			newState[ key ] = reducers[ key ]( state[ key ], action );
		} );
		return newState;
	} ),
	createRegistrySelector: jest.fn( ( fn ) => fn ),
	createReduxStore: jest.fn( () => ( {} ) ),
	createSelector: jest.fn( ( fn ) => fn ),
	register: jest.fn(),
} ) );

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

	return { setAttributes, setCurrentTrackClientId };
}

describe( 'PlaylistTrackEdit', () => {
	beforeEach( () => {
		mockMediaReplaceFlowProps = undefined;
		useDispatch.mockReturnValue( {
			createErrorNotice: jest.fn(),
		} );
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
