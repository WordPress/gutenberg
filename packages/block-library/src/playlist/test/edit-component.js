/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PlaylistEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
	BlockControls: ( {
		children,
		group = 'default',
		__experimentalShareWithChildBlocks,
	} ) => (
		<div
			data-share-with-child-blocks={
				__experimentalShareWithChildBlocks || undefined
			}
			data-testid={ `block-controls-${ group }` }
		>
			{ children }
		</div>
	),
	BlockIcon: () => <span />,
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	MediaPlaceholder: () => <div />,
	MediaReplaceFlow: ( { name } ) => <button>{ name }</button>,
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
	beforeEach( () => {
		useDispatch.mockReturnValue( {
			createErrorNotice: jest.fn(),
			replaceInnerBlocks: jest.fn(),
			selectBlock: jest.fn(),
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

	it( 'shares the add media control with child blocks', () => {
		render(
			<PlaylistEdit
				attributes={ defaultAttributes }
				clientId="playlist-1"
				insertBlocksAfter={ jest.fn() }
				isSelected
				setAttributes={ jest.fn() }
			/>
		);

		const otherControls = screen.getByTestId( 'block-controls-other' );

		expect( otherControls ).toHaveAttribute(
			'data-share-with-child-blocks',
			'media'
		);
		expect(
			within( otherControls ).getByRole( 'button', {
				name: 'Add track',
			} )
		).toBeInTheDocument();
	} );
} );
