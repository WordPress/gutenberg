import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import PlaylistEdit from '../edit';

let mediaPlaceholderProps;
let mediaReplaceFlowProps;
// The tracks the playlist holds. The inner blocks mock renders these, so a
// test can look at what ended up in the tracklist.
let mockTracks = [];
// Blocks the playlist creates need distinct client IDs, because a single
// Media Library selection can hold more than one track.
let mockCreatedBlockCount;

const mockLibraryTracks = [
	{
		id: 2,
		url: 'https://example.com/second-track.mp3',
		title: 'Second track',
	},
	{
		id: 3,
		url: 'https://example.com/third-track.mp3',
		title: 'Third track',
	},
];

vi.mock( '@wordpress/block-editor', () => ( {
	store: {},
	BlockControls: ( { children } ) => <div>{ children }</div>,
	BlockIcon: () => <span />,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	MediaPlaceholder: ( props ) => {
		mediaPlaceholderProps = props;
		return (
			<button onClick={ () => props.onSelect( mockLibraryTracks ) }>
				Media Library
			</button>
		);
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

vi.mock( '@wordpress/blocks', () => ( {
	createBlock: vi.fn( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: `new-track-${ ++mockCreatedBlockCount }`,
	} ) ),
} ) );

vi.mock( '@wordpress/components', () => ( {
	Disabled: ( { children } ) => <div>{ children }</div>,
	SelectControl: () => <div />,
	ToggleControl: () => <div />,
	__experimentalToolsPanel: ( { children } ) => <div>{ children }</div>,
	__experimentalToolsPanelItem: ( { children } ) => <div>{ children }</div>,
} ) );

vi.mock( '@wordpress/data', () => ( {
	useDispatch: vi.fn(),
	useSelect: vi.fn(),
} ) );

vi.mock( '@wordpress/notices', () => ( {
	store: {},
} ) );

vi.mock( '../../utils/caption', () => ( {
	Caption: () => <figcaption />,
} ) );

vi.mock( '../../utils/hooks', () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

vi.mock( '../../utils/waveform-player', () => ( {
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

function renderEdit( attributes = {} ) {
	return render(
		<PlaylistEdit
			attributes={ { ...defaultAttributes, ...attributes } }
			clientId="playlist-1"
			insertBlocksAfter={ vi.fn() }
			isSelected={ false }
			setAttributes={ vi.fn() }
		/>
	);
}

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
		mockCreatedBlockCount = 0;
		replaceInnerBlocks = vi.fn();
		insertBlocks = vi.fn();
		selectBlock = vi.fn();
		useDispatch.mockReturnValue( {
			createErrorNotice: vi.fn(),
			replaceInnerBlocks,
			insertBlocks,
			selectBlock,
			__unstableMarkNextChangeAsNotPersistent: vi.fn(),
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

		renderEdit();

		expect( mediaPlaceholderProps.multiple ).toBe( 'add' );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Media Library' } )
		);

		// Each selected file becomes its own track, rather than one track
		// holding the first of them.
		expect( trackClientIds() ).toEqual( [ 'new-track-1', 'new-track-2' ] );
		expect(
			screen
				.getAllByTestId( 'playlist-track' )
				.map( ( track ) => track.textContent )
		).toEqual( [ 'Second track', 'Third track' ] );
	} );

	it( 'lets users select additional audio tracks individually from the Media Library', () => {
		renderEdit();

		expect( mediaReplaceFlowProps.multiple ).toBe( 'add' );
	} );

	it( 'keeps track blocks mounted when the tracklist is hidden', () => {
		renderEdit( { showTracklist: false } );

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

		renderEdit();

		fireEvent.click( screen.getByRole( 'button', { name: 'Add track' } ) );

		expect( trackClientIds() ).toEqual( [
			'track-1',
			'placeholder-track',
			'new-track-1',
		] );
	} );

	it( 'adds tracks from the add track control', () => {
		renderEdit();

		fireEvent.click( screen.getByRole( 'button', { name: 'Add track' } ) );

		expect( trackClientIds() ).toEqual( [ 'track-1', 'new-track-1' ] );
		expect( selectBlock ).toHaveBeenCalledWith( 'new-track-1' );
	} );
} );
