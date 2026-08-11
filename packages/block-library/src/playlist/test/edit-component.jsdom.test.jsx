import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import PlaylistEdit from '../edit';

let mediaPlaceholderProps;
let mediaReplaceFlowProps;

vi.mock( '@wordpress/block-editor', () => ( {
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

vi.mock( '@wordpress/blocks', () => ( {
	createBlock: vi.fn( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: 'new-track',
	} ) ),
} ) );

vi.mock( '@wordpress/blob', () => ( {
	createBlobURL: vi.fn( () => 'blob:track' ),
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

vi.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	_x: ( text ) => text,
} ) );

vi.mock( '@wordpress/icons', () => ( {
	playlist: 'playlist',
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

describe( 'PlaylistEdit', () => {
	let replaceInnerBlocks;
	let selectBlock;

	beforeEach( () => {
		mediaPlaceholderProps = undefined;
		mediaReplaceFlowProps = undefined;
		replaceInnerBlocks = vi.fn();
		selectBlock = vi.fn();
		useDispatch.mockReturnValue( {
			createErrorNotice: vi.fn(),
			replaceInnerBlocks,
			selectBlock,
		} );
		useSelect.mockReturnValue( {
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
				insertBlocksAfter={ vi.fn() }
				isSelected={ false }
				setAttributes={ vi.fn() }
			/>
		);

		expect( mediaPlaceholderProps.multiple ).toBe( 'add' );
	} );

	it( 'lets users select additional audio tracks individually from the Media Library', () => {
		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ vi.fn() }
				isSelected={ false }
				setAttributes={ vi.fn() }
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
				insertBlocksAfter={ vi.fn() }
				isSelected={ false }
				setAttributes={ vi.fn() }
			/>
		);

		const tracklist = screen.getByRole( 'list' );

		expect( tracklist ).toHaveClass(
			'wp-block-playlist__tracklist-is-hidden'
		);
		expect( screen.getByTestId( 'playlist-track' ) ).toBeInTheDocument();
	} );

	it( 'adds tracks from the add track control', () => {
		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ vi.fn() }
				isSelected={ false }
				setAttributes={ vi.fn() }
			/>
		);

		fireEvent.click(
			screen.getByRole( 'button', {
				name: 'Add track',
			} )
		);

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
		expect( selectBlock ).toHaveBeenCalledWith( 'new-track' );
	} );
} );
