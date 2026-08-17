import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import PlaylistEdit from '../edit';

let mockMediaPlaceholderProps;
let mockMediaReplaceFlowProps;
let mockCreatedBlockCount;

const mockPlaceholderTracks = [
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

const mockAdditionalTrack = {
	id: 4,
	url: 'https://example.com/fourth-track.mp3',
	title: 'Fourth track',
};

jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
	BlockControls: ( { children } ) => <div>{ children }</div>,
	BlockIcon: () => <span />,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	MediaPlaceholder: ( props ) => {
		mockMediaPlaceholderProps = props;
		return (
			<button onClick={ () => props.onSelect( mockPlaceholderTracks ) }>
				Media Library
			</button>
		);
	},
	MediaReplaceFlow: ( props ) => {
		mockMediaReplaceFlowProps = props;
		return (
			<button onClick={ () => props.onSelect( mockAdditionalTrack ) }>
				{ props.name }
			</button>
		);
	},
	useBlockProps: () => ( { className: 'wp-block-playlist' } ),
	useInnerBlocksProps: ( blockProps ) => ( {
		...blockProps,
		children: <li data-testid="playlist-track" />,
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
		clientId: `new-track-${ ++mockCreatedBlockCount }`,
	} ) ),
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

function renderEdit( props = {} ) {
	return render(
		<PlaylistEdit
			attributes={ {
				...defaultAttributes,
				...props.attributes,
			} }
			clientId="playlist-1"
			insertBlocksAfter={ jest.fn() }
			isSelected={ false }
			setAttributes={ jest.fn() }
		/>
	);
}

describe( 'PlaylistEdit', () => {
	let replaceInnerBlocks;
	let selectBlock;
	let innerBlockTracks;

	beforeEach( () => {
		mockMediaPlaceholderProps = undefined;
		mockMediaReplaceFlowProps = undefined;
		mockCreatedBlockCount = 0;
		replaceInnerBlocks = jest.fn();
		selectBlock = jest.fn();
		innerBlockTracks = [
			{
				clientId: 'track-1',
				attributes: {
					id: 1,
					src: 'https://example.com/audio.mp3',
					title: 'Sample track',
				},
			},
		];
		useDispatch.mockReturnValue( {
			createErrorNotice: jest.fn(),
			replaceInnerBlocks,
			selectBlock,
		} );
		useSelect.mockImplementation( () => ( {
			innerBlockTracks,
		} ) );
	} );

	it( 'lets users select audio tracks individually from the Media Library', () => {
		innerBlockTracks = [];

		renderEdit();

		expect( mockMediaPlaceholderProps.multiple ).toBe( 'add' );

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Media Library',
			} )
		);

		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( {
				clientId: 'new-track-1',
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					id: 2,
					src: 'https://example.com/second-track.mp3',
					title: 'Second track',
				} ),
			} ),
			expect.objectContaining( {
				clientId: 'new-track-2',
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					id: 3,
					src: 'https://example.com/third-track.mp3',
					title: 'Third track',
				} ),
			} ),
		] );
	} );

	it( 'lets users select additional audio tracks individually from the Media Library', () => {
		renderEdit();

		expect( mockMediaReplaceFlowProps.multiple ).toBe( 'add' );
	} );

	it( 'keeps track blocks mounted when the tracklist is hidden', () => {
		renderEdit( {
			attributes: {
				showTracklist: false,
			},
		} );

		const tracklist = screen.getByRole( 'list' );

		expect( tracklist ).toHaveClass(
			'wp-block-playlist__tracklist-is-hidden'
		);
		expect( screen.getByTestId( 'playlist-track' ) ).toBeInTheDocument();
	} );

	it( 'adds tracks from the add track control', () => {
		renderEdit();

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Add track',
			} )
		);

		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( { clientId: 'track-1' } ),
			expect.objectContaining( {
				clientId: 'new-track-1',
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					id: 4,
					src: 'https://example.com/fourth-track.mp3',
					title: 'Fourth track',
				} ),
			} ),
		] );
		expect( selectBlock ).toHaveBeenCalledWith( 'new-track-1' );
	} );
} );
