/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { WaveformPlayer } from '../waveform-player';
import { initWaveformPlayer } from '../waveform-utils';

jest.mock( '../waveform-utils', () => ( {
	initWaveformPlayer: jest.fn(),
} ) );

/**
 * Create a fake player instance that mimics the parts of the waveform
 * player instance the component manipulates.
 *
 * @param {Object}  options Options passed to initWaveformPlayer.
 * @param {Element} element The element passed to initWaveformPlayer.
 * @return {Object} The fake player.
 */
function createFakePlayer( options, element ) {
	const titleEl = document.createElement( 'span' );
	titleEl.textContent = options.title ?? '';
	// The subtitle and artwork elements only exist when the track had an
	// artist/image when the player was created, mirroring the library markup.
	let subtitleEl = null;
	if ( options.artist ) {
		subtitleEl = document.createElement( 'span' );
		subtitleEl.textContent = options.artist;
	}
	let artworkEl = null;
	if ( options.image ) {
		artworkEl = document.createElement( 'img' );
		artworkEl.src = options.image;
	}

	element.append( titleEl );
	if ( subtitleEl ) {
		element.append( subtitleEl );
	}
	if ( artworkEl ) {
		element.append( artworkEl );
	}

	return {
		instance: { titleEl, subtitleEl, artworkEl },
		destroy: jest.fn(),
	};
}

describe( 'WaveformPlayer', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		initWaveformPlayer.mockImplementation( ( element, options ) =>
			createFakePlayer( options, element )
		);
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		initWaveformPlayer.mockReset();
	} );

	const baseProps = {
		src: 'https://example.com/song.mp3',
		title: 'Original Title',
		artist: 'Original Artist',
		image: 'https://example.com/cover.jpg',
		onEnded: () => {},
	};

	it( 'initializes the player once with the provided metadata', () => {
		render( <WaveformPlayer { ...baseProps } /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining( {
				src: baseProps.src,
				title: 'Original Title',
				artist: 'Original Artist',
				image: 'https://example.com/cover.jpg',
			} )
		);
	} );

	it( 'updates metadata on the live player without recreating it', () => {
		const { rerender } = render( <WaveformPlayer { ...baseProps } /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender(
			<WaveformPlayer
				{ ...baseProps }
				title="New Title"
				artist="New Artist"
				image="https://example.com/new.jpg"
			/>
		);

		// The player is updated in place, not destroyed and recreated.
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( player.destroy ).not.toHaveBeenCalled();
		expect( player.instance.titleEl ).toHaveTextContent( 'New Title' );
		expect( player.instance.subtitleEl ).toHaveTextContent( 'New Artist' );
		expect( player.instance.artworkEl ).toHaveAttribute(
			'src',
			'https://example.com/new.jpg'
		);
	} );

	it( 'recreates the player when the src changes', () => {
		const { rerender } = render( <WaveformPlayer { ...baseProps } /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender(
			<WaveformPlayer
				{ ...baseProps }
				src="https://example.com/other.mp3"
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'recreates the player to show an image added to a track that had none', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } image="" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const firstPlayer = initWaveformPlayer.mock.results[ 0 ].value;
		// No artwork element exists when the track started without an image.
		expect( firstPlayer.instance.artworkEl ).toBeNull();

		rerender(
			<WaveformPlayer
				{ ...baseProps }
				image="https://example.com/added.jpg"
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( firstPlayer.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
		const secondPlayer = initWaveformPlayer.mock.results[ 1 ].value;
		expect( secondPlayer.instance.artworkEl ).toHaveAttribute(
			'src',
			'https://example.com/added.jpg'
		);
	} );

	it( 'recreates the player when the image is removed', () => {
		const { rerender } = render( <WaveformPlayer { ...baseProps } /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender( <WaveformPlayer { ...baseProps } image="" /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
		const secondPlayer = initWaveformPlayer.mock.results[ 1 ].value;
		expect( secondPlayer.instance.artworkEl ).toBeNull();
	} );

	it( 'updates the player in place to show an artist added to a track that had none', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } artist="" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const firstPlayer = initWaveformPlayer.mock.results[ 0 ].value;
		// The editor seeds a hidden subtitle element so artist edits can
		// update in place.
		expect( firstPlayer.instance.subtitleEl ).toHaveTextContent( '' );
		expect( firstPlayer.instance.subtitleEl ).toHaveStyle( {
			display: 'none',
		} );

		rerender( <WaveformPlayer { ...baseProps } artist="New Artist" /> );

		expect( firstPlayer.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( firstPlayer.instance.subtitleEl ).toHaveTextContent(
			'New Artist'
		);
		expect( firstPlayer.instance.subtitleEl ).not.toHaveStyle( {
			display: 'none',
		} );
	} );

	it( 'updates the player in place when the artist is removed', () => {
		const { rerender } = render( <WaveformPlayer { ...baseProps } /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender( <WaveformPlayer { ...baseProps } artist="" /> );

		expect( player.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( player.instance.subtitleEl ).toHaveTextContent( '' );
		expect( player.instance.subtitleEl ).toHaveStyle( {
			display: 'none',
		} );
	} );
} );
