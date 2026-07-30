/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PlaylistEdit from '../edit';

vi.mock( import( '@wordpress/block-editor' ), () => ( {
	store: {},
	BlockControls: ( { children } ) => <div>{ children }</div>,
	BlockIcon: () => <span />,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	MediaPlaceholder: () => <div />,
	MediaReplaceFlow: () => <div />,
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

vi.mock( import( '@wordpress/blocks' ), () => ( {
	createBlock: vi.fn( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: 'new-track',
	} ) ),
} ) );

vi.mock( import( '@wordpress/blob' ), () => ( {
	createBlobURL: vi.fn( () => 'blob:track' ),
} ) );

vi.mock( import( '@wordpress/components' ), () => ( {
	Disabled: ( { children } ) => <div>{ children }</div>,
	SelectControl: () => <div />,
	ToggleControl: () => <div />,
	__experimentalToolsPanel: ( { children } ) => <div>{ children }</div>,
	__experimentalToolsPanelItem: ( { children } ) => <div>{ children }</div>,
} ) );

vi.mock( import( '@wordpress/data' ), () => ( {
	useDispatch: vi.fn(),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '@wordpress/i18n' ), () => ( {
	__: ( text ) => text,
	_x: ( text ) => text,
} ) );

vi.mock( import( '@wordpress/icons' ), () => ( {
	playlist: 'playlist',
} ) );

vi.mock( import( '@wordpress/notices' ), () => ( {
	store: {},
} ) );

vi.mock( import( '../../utils/caption' ), () => ( {
	Caption: () => <figcaption />,
} ) );

vi.mock( import( '../../utils/hooks' ), () => ( {
	useToolsPanelDropdownMenuProps: () => ( {} ),
} ) );

vi.mock( import( '../../utils/waveform-player' ), () => ( {
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
	beforeEach( () => {
		useDispatch.mockReturnValue( {
			createErrorNotice: vi.fn(),
			replaceInnerBlocks: vi.fn(),
			selectBlock: vi.fn(),
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
} );
