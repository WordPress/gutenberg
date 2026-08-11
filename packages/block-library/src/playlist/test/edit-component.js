import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import PlaylistEdit from '../edit';

let mediaPlaceholderProps;
let mediaReplaceFlowProps;
let mockZipEntries;

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
		clientId: 'new-track',
	} ) ),
} ) );

jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:track' ),
} ) );

jest.mock( '@zip.js/zip.js/lib/zip-no-worker-inflate.js', () => ( {
	BlobReader: jest.fn(),
	BlobWriter: jest.fn( function ( type ) {
		this.type = type;
	} ),
	ZipReader: jest.fn( function () {
		this.getEntries = jest.fn( () => Promise.resolve( mockZipEntries ) );
		this.close = jest.fn( () => Promise.resolve() );
	} ),
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
	let selectBlock;
	let createErrorNotice;
	let mediaUpload;

	function createZipFile() {
		return new File( [ 'playlist' ], 'album.zip', {
			type: 'application/zip',
		} );
	}

	function createZipEntry( filename ) {
		return {
			filename,
			directory: false,
			lastModDate: new Date( '2026-08-11T00:00:00Z' ),
			getData: jest.fn( ( writer ) =>
				Promise.resolve(
					new Blob( [ filename ], { type: writer.type } )
				)
			),
		};
	}

	beforeEach( () => {
		mediaPlaceholderProps = undefined;
		mediaReplaceFlowProps = undefined;
		mockZipEntries = [
			createZipEntry( 'scruffian - Relics - 02 Bramblers Relic.mp3' ),
			createZipEntry( 'scruffian - Relics - 01 Curing.mp3' ),
			createZipEntry( 'cover.png' ),
		];
		replaceInnerBlocks = jest.fn();
		selectBlock = jest.fn();
		createErrorNotice = jest.fn();
		mediaUpload = jest.fn( ( { filesList, onFileChange } ) =>
			onFileChange(
				Array.from( filesList ).map( ( file, index ) => ( {
					id: index + 10,
					url: `https://example.com/${ file.name }`,
					title: file.name.replace( /\.[^.]+$/, '' ),
				} ) )
			)
		);
		useDispatch.mockReturnValue( {
			createErrorNotice,
			replaceInnerBlocks,
			selectBlock,
		} );
		useSelect.mockReturnValue( {
			mediaUpload,
			innerBlockTracks: [
				{
					clientId: 'track-1',
					attributes: {
						id: 1,
						src: 'https://example.com/audio.mp3',
						title: 'Sample track',
					},
				},
			],
		} );
	} );

	it( 'lets users select audio tracks individually from the Media Library', () => {
		useSelect.mockReturnValue( {
			innerBlockTracks: [],
		} );

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

	it( 'adds tracks from the add track control', async () => {
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

		await waitFor( () => {
			expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
				expect.objectContaining( { clientId: 'track-1' } ),
				expect.objectContaining( {
					clientId: 'new-track',
					name: 'core/playlist-track',
					attributes: expect.objectContaining( {
						id: 2,
						src: 'https://example.com/second-track.mp3',
						title: 'Second track',
					} ),
				} ),
			] );
		} );
		expect( selectBlock ).toHaveBeenCalledWith( 'new-track' );
	} );

	it( 'fills playlist tracks from an uploaded ZIP file', async () => {
		useSelect.mockReturnValue( {
			mediaUpload,
			innerBlockTracks: [],
		} );

		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		await act( async () => {
			await mediaPlaceholderProps.onSelect( createZipFile() );
		} );

		expect( mediaPlaceholderProps.accept ).toBe(
			'audio/*,.zip,application/zip,application/x-zip-compressed'
		);
		expect( mediaUpload ).toHaveBeenCalledWith(
			expect.objectContaining( {
				allowedTypes: [ 'audio', 'image' ],
				filesList: [
					expect.objectContaining( {
						name: 'scruffian - Relics - 01 Curing.mp3',
					} ),
					expect.objectContaining( {
						name: 'scruffian - Relics - 02 Bramblers Relic.mp3',
					} ),
					expect.objectContaining( { name: 'cover.png' } ),
				],
				multiple: true,
			} )
		);
		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					id: 10,
					src: 'https://example.com/scruffian - Relics - 01 Curing.mp3',
					title: 'Curing',
					artist: 'scruffian',
					album: 'Relics',
					image: 'https://example.com/cover.png',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					id: 11,
					src: 'https://example.com/scruffian - Relics - 02 Bramblers Relic.mp3',
					title: 'Bramblers Relic',
					artist: 'scruffian',
					album: 'Relics',
					image: 'https://example.com/cover.png',
				} ),
			} ),
		] );
		expect(
			replaceInnerBlocks.mock.calls[ 0 ][ 1 ][ 0 ].attributes
		).not.toHaveProperty( 'trackNumber' );
	} );

	it( 'adds ZIP tracks to an existing playlist', async () => {
		useSelect.mockReturnValue( {
			mediaUpload,
			innerBlockTracks: [
				{
					clientId: 'track-1',
					attributes: {
						id: 10,
						src: 'https://example.com/Curing.mp3',
						title: 'Curing',
					},
				},
			],
		} );

		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		await act( async () => {
			await mediaReplaceFlowProps.onSelect( createZipFile() );
		} );

		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( { clientId: 'track-1' } ),
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					id: 11,
					title: 'Bramblers Relic',
				} ),
			} ),
		] );
		expect( selectBlock ).toHaveBeenCalledWith( 'new-track' );
	} );

	it( 'shows an error when an uploaded ZIP file does not contain audio files', async () => {
		mockZipEntries = [ createZipEntry( 'cover.png' ) ];
		useSelect.mockReturnValue( {
			mediaUpload,
			innerBlockTracks: [],
		} );

		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected={ false }
				setAttributes={ jest.fn() }
			/>
		);

		await act( async () => {
			await mediaPlaceholderProps.onSelect( createZipFile() );
		} );

		expect( createErrorNotice ).toHaveBeenCalledWith(
			'The ZIP file does not contain any audio files.',
			{ type: 'snackbar' }
		);
		expect( mediaUpload ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
	} );
} );
