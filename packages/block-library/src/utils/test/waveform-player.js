/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { WaveformPlayer } from '../waveform-player';
import {
	applyWaveformPlayerStyles,
	initWaveformPlayer,
	setupPlayButtonArtwork,
} from '../waveform-utils';

jest.mock( '../waveform-utils', () => ( {
	applyWaveformPlayerStyles: jest.fn(),
	initWaveformPlayer: jest.fn(),
	setupPlayButtonArtwork: jest.fn(),
	updateSeekControlLabel: jest.fn(),
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
	// The artist and artwork elements only exist when the track had an
	// artist/player artwork when the player was created, mirroring the library markup.
	let artistEl = null;
	if ( options.artist ) {
		artistEl = document.createElement( 'span' );
		artistEl.textContent = options.artist;
	}
	let artworkEl = null;
	if ( options.image && ! options.showPlayButtonArtwork ) {
		artworkEl = document.createElement( 'img' );
		artworkEl.src = options.image;
		artworkEl.alt = options.imageAlt || '';
	}

	element.append( titleEl );
	if ( artistEl ) {
		element.append( artistEl );
	}
	if ( artworkEl ) {
		element.append( artworkEl );
	}

	const instance = {
		titleEl,
		artistEl: artistEl || null,
		artworkEl: artworkEl || null,
		pause: jest.fn(),
		syncArtist: jest.fn( ( artist ) => {
			if ( ! artist ) {
				instance.artistEl?.remove();
				instance.artistEl = null;
				return;
			}
			if ( ! instance.artistEl ) {
				instance.artistEl = document.createElement( 'span' );
				element.append( instance.artistEl );
			}
			instance.artistEl.textContent = artist;
			instance.artistEl.style.display = '';
		} ),
		syncArtwork: jest.fn( ( image, imageAlt = '' ) => {
			if ( ! image ) {
				instance.artworkEl?.remove();
				instance.artworkEl = null;
				return;
			}
			if ( ! instance.artworkEl ) {
				instance.artworkEl = document.createElement( 'img' );
				element.append( instance.artworkEl );
			}
			instance.artworkEl.src = image;
			instance.artworkEl.alt = imageAlt || '';
		} ),
		loadTrack: jest.fn( async ( src, title, artist, trackOptions ) => {
			titleEl.textContent = title;
			instance.syncArtist( artist );
			instance.syncArtwork(
				trackOptions.artwork,
				trackOptions.artworkAlt
			);
		} ),
	};

	return {
		instance,
		container: element,
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
		applyWaveformPlayerStyles.mockReset();
		initWaveformPlayer.mockReset();
		setupPlayButtonArtwork.mockReset();
	} );

	const baseProps = {
		src: 'https://example.com/song.mp3',
		title: 'Original Title',
		artist: 'Original Artist',
		image: 'https://example.com/cover.jpg',
		imageAlt: 'A bright abstract track image',
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
				imageAlt: 'A bright abstract track image',
				showPlayButtonArtwork: false,
			} )
		);
	} );

	it( 'passes the play button artwork option to the shared player', () => {
		render( <WaveformPlayer { ...baseProps } showPlayButtonArtwork /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( initWaveformPlayer ).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining( {
				showPlayButtonArtwork: true,
			} )
		);
	} );

	it( 'initializes the player with custom color values', () => {
		render(
			<WaveformPlayer
				{ ...baseProps }
				color="#ff0000"
				gradient="linear-gradient(90deg,#ff0000 0%,#0000ff 100%)"
				backgroundColor="#ffeeaa"
				backgroundGradient="linear-gradient(90deg,#ffeeaa 0%,#aabbcc 100%)"
				textColor="#0000ff"
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( initWaveformPlayer ).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining( {
				waveformColor: '#ff0000',
				waveformGradient:
					'linear-gradient(90deg,#ff0000 0%,#0000ff 100%)',
				backgroundColor: '#ffeeaa',
				backgroundGradient:
					'linear-gradient(90deg,#ffeeaa 0%,#aabbcc 100%)',
				textColor: '#0000ff',
			} )
		);
	} );

	it( 'omits separate player artwork when play button artwork is enabled', () => {
		render( <WaveformPlayer { ...baseProps } showPlayButtonArtwork /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		expect( player.instance.artworkEl ).toBeNull();
	} );

	it( 'updates play button artwork when artwork metadata changes', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } showPlayButtonArtwork />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender(
			<WaveformPlayer
				{ ...baseProps }
				image="https://example.com/new.jpg"
				showPlayButtonArtwork
			/>
		);

		expect( setupPlayButtonArtwork ).toHaveBeenCalledWith(
			player.container,
			'https://example.com/new.jpg'
		);
		expect( player.instance.artworkEl ).toBeNull();
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
				imageAlt="A black and white portrait"
			/>
		);

		// The player is updated in place, not destroyed and recreated.
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( player.destroy ).not.toHaveBeenCalled();
		expect( player.instance.titleEl ).toHaveTextContent( 'New Title' );
		expect( player.instance.artistEl ).toHaveTextContent( 'New Artist' );
		expect( player.instance.artworkEl ).toHaveAttribute(
			'src',
			'https://example.com/new.jpg'
		);
		expect( player.instance.artworkEl ).toHaveAttribute(
			'alt',
			'A black and white portrait'
		);
	} );

	it( 'does not recreate the player when the src changes', () => {
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

		expect( player.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( player.instance.loadTrack ).toHaveBeenCalledWith(
			'https://example.com/other.mp3',
			'Original Title',
			'Original Artist',
			{
				artwork: 'https://example.com/cover.jpg',
				artworkAlt: 'A bright abstract track image',
			}
		);
	} );

	it( 'recreates the player when play button artwork is toggled', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } showPlayButtonArtwork={ false } />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender( <WaveformPlayer { ...baseProps } showPlayButtonArtwork /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
		expect( initWaveformPlayer.mock.calls[ 1 ][ 1 ] ).toEqual(
			expect.objectContaining( {
				showPlayButtonArtwork: true,
			} )
		);
		expect(
			initWaveformPlayer.mock.results[ 1 ].value.instance.artworkEl
		).toBeNull();
	} );

	it( 'recreates the player when the waveform color changes', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } color="#ff0000" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender( <WaveformPlayer { ...baseProps } color="#0000ff" /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
		expect( initWaveformPlayer ).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.objectContaining( {
				waveformColor: '#0000ff',
			} )
		);
	} );

	it( 'updates the waveform background color without recreating the player', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } backgroundColor="#ffeeaa" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender(
			<WaveformPlayer { ...baseProps } backgroundColor="#aabbcc" />
		);

		expect( player.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( applyWaveformPlayerStyles ).toHaveBeenCalledWith(
			player.container,
			{
				backgroundColor: '#aabbcc',
				backgroundGradient: undefined,
				playButtonColor: undefined,
				playButtonGradient: undefined,
				textColor: undefined,
			}
		);
	} );

	it( 'recreates the player when the waveform gradient changes', () => {
		const { rerender } = render(
			<WaveformPlayer
				{ ...baseProps }
				gradient="linear-gradient(90deg,#ff0000 0%,#0000ff 100%)"
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender(
			<WaveformPlayer
				{ ...baseProps }
				gradient="linear-gradient(90deg,#00ff00 0%,#0000ff 100%)"
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
		expect( initWaveformPlayer ).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.objectContaining( {
				waveformGradient:
					'linear-gradient(90deg,#00ff00 0%,#0000ff 100%)',
			} )
		);
	} );

	it( 'updates the player in place to show an image added to a track that had none', () => {
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

		expect( firstPlayer.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( firstPlayer.instance.artworkEl ).toHaveAttribute(
			'src',
			'https://example.com/added.jpg'
		);
	} );

	it( 'updates the player in place when the image is removed', () => {
		const { rerender } = render( <WaveformPlayer { ...baseProps } /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;

		rerender( <WaveformPlayer { ...baseProps } image="" /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( player.instance.artworkEl ).toBeNull();
	} );

	it( 'updates the player in place to show an artist added to a track that had none', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } artist="" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const firstPlayer = initWaveformPlayer.mock.results[ 0 ].value;
		expect( firstPlayer.instance.artistEl ).toBeNull();

		rerender( <WaveformPlayer { ...baseProps } artist="New Artist" /> );

		expect( firstPlayer.destroy ).not.toHaveBeenCalled();
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( firstPlayer.instance.artistEl ).toHaveTextContent(
			'New Artist'
		);
		expect( firstPlayer.instance.artistEl ).not.toHaveStyle( {
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
		expect( player.instance.artistEl ).toBeNull();
	} );
} );
