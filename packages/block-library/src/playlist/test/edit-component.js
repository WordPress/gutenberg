import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import PlaylistEdit from '../edit';

let mediaPlaceholderProps;
let mediaReplaceFlowProps;
// The tracks the playlist holds. The inner blocks mock renders these, so a
// test can look at what ended up in the tracklist.
let mockTracks = [];

jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
	BlockControls: ( { children } ) => <div>{ children }</div>,
	BlockIcon: () => <span />,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	MediaPlaceholder: ( props ) => {
		mediaPlaceholderProps = props;
		return <div />;
	},
	MediaReplaceFlow: ( props ) => {
		mediaReplaceFlowProps = props;
		return (
			<button
				onClick={ () =>
					props.onSelect( {
						id: 2,
						url: 'https://example.com/second-track.mp3',
						title: 'Second track',
					} )
				}
			>
				{ props.name }
			</button>
		);
	},
	useBlockProps: () => ( { className: 'wp-block-playlist' } ),
	useInnerBlocksProps: ( blockProps ) => ( {
		...blockProps,
		children: mockTracks.map( ( track ) => (
			<li key={ track.clientId } data-testid="playlist-track">
				{ track.attributes.title }
			</li>
		) ),
	} ),
	__experimentalColorGradientSettingsDropdown: () => <div />,
	__experimentalUseMultipleOriginColorsAndGradients: () => ( {
		colors: [],
		gradients: [],
		disableCustomColors: true,
		disableCustomGradients: true,
	} ),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: 'new-track',
	} ) ),
} ) );

jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:track' ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Disabled: ( { children } ) => <div>{ children }</div>,
	SelectControl: () => <div />,
	ToggleControl: () => <div />,
	__experimentalToolsPanel: ( { children } ) => <div>{ children }</div>,
	__experimentalToolsPanelItem: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	_x: ( text ) => text,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	playlist: 'playlist',
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: {},
} ) );

jest.mock( '../../utils/caption', () => ( {
	Caption: () => <figcaption />,
} ) );

jest.mock( '../../utils/hooks', () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

jest.mock( '../../utils/waveform-player', () => ( {
	WaveformPlayer: () => <div />,
} ) );

const defaultAttributes = {
	order: 'asc',
	showTracklist: true,
	showNumbers: true,
	showImages: true,
	showPlayButtonArtwork: false,
	showArtists: true,
	showTrackLength: true,
};

describe( 'PlaylistEdit', () => {
	let replaceInnerBlocks;
	let insertBlocks;
	let selectBlock;

	// The playlist reads its tracks from the store and changes them through
	// dispatched actions. Keeping a list here lets a test assert which tracks
	// the playlist ends up with, rather than which action it reached for.
	const trackStore = ( initial ) => {
		mockTracks = initial;
		useSelect.mockImplementation( () => ( {
			innerBlockTracks: mockTracks,
		} ) );
		insertBlocks.mockImplementation( ( blocks, index ) => {
			const at = index ?? mockTracks.length;
			mockTracks = [
				...mockTracks.slice( 0, at ),
				...blocks,
				...mockTracks.slice( at ),
			];
		} );
		replaceInnerBlocks.mockImplementation( ( _clientId, next ) => {
			mockTracks = next;
		} );
	};
	const trackClientIds = () => mockTracks.map( ( track ) => track.clientId );

	beforeEach( () => {
		mediaPlaceholderProps = undefined;
		mediaReplaceFlowProps = undefined;
		replaceInnerBlocks = jest.fn();
		insertBlocks = jest.fn();
		selectBlock = jest.fn();
		useDispatch.mockReturnValue( {
			createErrorNotice: jest.fn(),
			replaceInnerBlocks,
			insertBlocks,
			selectBlock,
			__unstableMarkNextChangeAsNotPersistent: jest.fn(),
		} );
		trackStore( [
			{
				clientId: 'track-1',
				attributes: {
					id: 1,
					src: 'https://example.com/audio.mp3',
					title: 'Sample track',
				},
			},
		] );
	} );

	it( 'lets users select audio tracks individually from the Media Library', () => {
		trackStore( [] );

		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		expect( mediaPlaceholderProps.multiple ).toBe( 'add' );
	} );

	it( 'lets users select additional audio tracks individually from the Media Library', () => {
		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		expect( mediaReplaceFlowProps.multiple ).toBe( 'add' );
	} );

	it( 'keeps track blocks mounted when the tracklist is hidden', () => {
		render(
			<PlaylistEdit
				attributes={ {
					...defaultAttributes,
					showTracklist: false,
				} }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		const tracklist = screen.getByRole( 'list' );

		expect( tracklist ).toHaveClass(
			'wp-block-playlist__tracklist-is-hidden'
		);
		expect( screen.getByTestId( 'playlist-track' ) ).toBeInTheDocument();
	} );

	it( 'preserves placeholder tracks when adding tracks', () => {
		trackStore( [
			{
				clientId: 'track-1',
				attributes: {
					id: 1,
					src: 'https://example.com/audio.mp3',
					title: 'Sample track',
				},
			},
			// A track the user added but has not filled in yet.
			{ clientId: 'placeholder-track', attributes: {} },
		] );

		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Add track' } ) );

		expect( trackClientIds() ).toEqual( [
			'track-1',
			'placeholder-track',
			'new-track',
		] );
	} );

	it( 'adds tracks from the add track control', () => {
		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Add track',
			} )
		);

		expect( trackClientIds() ).toEqual( [ 'track-1', 'new-track' ] );
		expect( selectBlock ).toHaveBeenCalledWith( 'new-track' );
	} );
} );
