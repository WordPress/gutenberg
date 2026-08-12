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
	Uint8ArrayReader: jest.fn(),
	Uint8ArrayWriter: jest.fn( function ( type ) {
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
	sprintf: ( text, replacement ) => text.replace( '%s', replacement ),
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
	let uploadedFileCount;

	function createBytes( value ) {
		return new Uint8Array(
			Array.from( value ).map( ( character ) =>
				character.charCodeAt( 0 )
			)
		);
	}

	function createStoredZipData( entries ) {
		const chunks = [];
		let offset = 0;

		for ( const entry of entries ) {
			const filename = createBytes( entry.filename );
			const data = createBytes( entry.filename );
			const header = new Uint8Array( 30 + filename.length );
			const headerView = new DataView( header.buffer );

			headerView.setUint32( 0, 0x04034b50, true );
			headerView.setUint16( 8, 0, true );
			headerView.setUint32( 18, data.length, true );
			headerView.setUint32( 22, data.length, true );
			headerView.setUint16( 26, filename.length, true );
			header.set( filename, 30 );

			Object.assign( entry, {
				offset,
				compressedSize: data.length,
				uncompressedSize: data.length,
				compressionMethod: 0,
			} );

			chunks.push( header, data );
			offset += header.length + data.length;
		}

		return chunks;
	}

	function createZipFile() {
		return new File( createStoredZipData( mockZipEntries ), 'album.zip', {
			type: 'application/zip',
		} );
	}

	function createZipEntry( filename ) {
		return {
			filename,
			directory: false,
			lastModDate: new Date( '2026-08-11T00:00:00Z' ),
			getData: jest.fn( () => Promise.resolve( new Uint8Array() ) ),
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
		uploadedFileCount = 0;
		mediaUpload = jest.fn( ( { filesList, onFileChange } ) => {
			const attachments = Array.from( filesList ).map(
				( file, index ) => ( {
					id: uploadedFileCount + index + 10,
					url: `https://example.com/${ file.name }`,
					title: file.name.replace( /\.[^.]+$/, '' ),
				} )
			);
			uploadedFileCount += attachments.length;
			onFileChange( attachments );
		} );
		window.fetch = jest.fn( () =>
			Promise.resolve( {
				ok: true,
				blob: () =>
					Promise.resolve(
						new Blob( [ 'playlist' ], {
							type: 'application/zip',
						} )
					),
			} )
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
		expect( mediaPlaceholderProps.allowedTypes ).toEqual( [
			'audio',
			'application/zip',
			'application/x-zip',
			'application/x-zip-compressed',
		] );
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
			'audio/*,.zip,application/zip,application/x-zip,application/x-zip-compressed'
		);
		expect( mediaUpload ).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining( {
				allowedTypes: [ 'audio', 'image' ],
				filesList: [
					expect.objectContaining( {
						name: 'scruffian - Relics - 01 Curing.mp3',
					} ),
				],
				multiple: false,
			} )
		);
		expect( mediaUpload.mock.calls[ 0 ][ 0 ].filesList[ 0 ].type ).toBe(
			''
		);
		expect( mediaUpload ).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining( {
				allowedTypes: [ 'audio', 'image' ],
				filesList: [
					expect.objectContaining( {
						name: 'scruffian - Relics - 02 Bramblers Relic.mp3',
					} ),
				],
				multiple: false,
			} )
		);
		expect( mediaUpload ).toHaveBeenNthCalledWith(
			3,
			expect.objectContaining( {
				allowedTypes: [ 'audio', 'image' ],
				filesList: [ expect.objectContaining( { name: 'cover.png' } ) ],
				multiple: false,
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
		expect( mockZipEntries[ 0 ].getData ).not.toHaveBeenCalled();
	} );

	it( 'fills playlist tracks from a ZIP attachment selected in the Media Library', async () => {
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
			await mediaPlaceholderProps.onSelect( {
				id: 20,
				filename: 'album.zip',
				mime_type: 'application/zip',
				url: 'https://example.com/album.zip',
			} );
		} );

		expect( window.fetch ).toHaveBeenCalledWith(
			'https://example.com/album.zip'
		);
		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					title: 'Curing',
					artist: 'scruffian',
					album: 'Relics',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					title: 'Bramblers Relic',
					artist: 'scruffian',
					album: 'Relics',
				} ),
			} ),
		] );
	} );

	it( 'fills playlist tracks from a legacy ZIP attachment selected in the Media Library', async () => {
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
			await mediaPlaceholderProps.onSelect( {
				id: 20,
				type: 'application',
				mime: 'application/zip',
				url: 'https://example.com/download?id=20',
			} );
		} );

		expect( window.fetch ).toHaveBeenCalledWith(
			'https://example.com/download?id=20'
		);
		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					title: 'Curing',
					artist: 'scruffian',
					album: 'Relics',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					title: 'Bramblers Relic',
					artist: 'scruffian',
					album: 'Relics',
				} ),
			} ),
		] );
	} );

	it( 'shows an error when a non-audio media item is selected', async () => {
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
			await mediaPlaceholderProps.onSelect( {
				id: 20,
				mime_type: 'image/png',
				url: 'https://example.com/image.png',
			} );
		} );

		expect( createErrorNotice ).toHaveBeenCalledWith(
			'Only audio files and ZIP files can be added to a playlist.',
			{ type: 'snackbar' }
		);
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
	} );

	it( 'fills playlist tracks when the ZIP cover image upload fails', async () => {
		mediaUpload = jest.fn( ( { filesList, onFileChange, onError } ) => {
			const [ file ] = filesList;
			if ( file.name === 'cover.png' ) {
				onError( 'The cover image could not be uploaded.' );
				return;
			}

			const attachment = {
				id: uploadedFileCount + 10,
				url: `https://example.com/${ file.name }`,
				title: file.name.replace( /\.[^.]+$/, '' ),
			};
			uploadedFileCount += 1;
			onFileChange( [ attachment ] );
		} );
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

		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'playlist-1', [
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					title: 'Curing',
					artist: 'scruffian',
					album: 'Relics',
				} ),
			} ),
			expect.objectContaining( {
				name: 'core/playlist-track',
				attributes: expect.objectContaining( {
					title: 'Bramblers Relic',
					artist: 'scruffian',
					album: 'Relics',
				} ),
			} ),
		] );
		expect(
			replaceInnerBlocks.mock.calls[ 0 ][ 1 ][ 0 ].attributes
		).toHaveProperty( 'image', undefined );
		expect( createErrorNotice ).toHaveBeenCalledWith(
			'The cover image from the ZIP file could not be uploaded: The cover image could not be uploaded.',
			{ type: 'snackbar' }
		);
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
