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
	let artistEl;
	if ( options.artist ) {
		artistEl = document.createElement( 'span' );
		artistEl.textContent = options.artist;
	}
	let artworkEl;
	if ( options.image ) {
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
		imageAlt: 'A bright abstract album cover',
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
				imageAlt: 'A bright abstract album cover',
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
				artworkAlt: 'A bright abstract album cover',
			}
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
