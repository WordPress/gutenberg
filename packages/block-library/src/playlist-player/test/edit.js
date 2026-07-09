/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PlaylistPlayerEdit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	useBlockProps: jest.fn( ( props ) => props ),
	__experimentalColorGradientSettingsDropdown: () => <div />,
	__experimentalUseMultipleOriginColorsAndGradients: jest.fn( () => ( {
		hasColorsOrGradients: true,
	} ) ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Disabled: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

jest.mock( '../../utils/waveform-player', () => ( {
	WaveformPlayer: () => <div data-testid="waveform-player" />,
} ) );

describe( 'PlaylistPlayerEdit', () => {
	beforeEach( () => {
		useBlockProps.mockClear();
	} );

	it( 'renders the waveform player', () => {
		render(
			<PlaylistPlayerEdit
				attributes={ {} }
				clientId="playlist-player-client-id"
				isSelected
				setAttributes={ jest.fn() }
			/>
		);

		expect( screen.getByTestId( 'waveform-player' ) ).toBeVisible();
	} );

	it( 'adds the waveform color custom property', () => {
		render(
			<PlaylistPlayerEdit
				attributes={ { waveformColor: '#ff0000' } }
				clientId="playlist-player-client-id"
				isSelected
				setAttributes={ jest.fn() }
			/>
		);

		expect( useBlockProps ).toHaveBeenCalledWith(
			expect.objectContaining( {
				style: {
					'--wp--playlist-player--waveform-color': '#ff0000',
				},
			} )
		);
	} );
} );
