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
} from '../waveform-utils';

jest.mock( '../waveform-utils', () => ( {
	applyWaveformPlayerStyles: jest.fn(),
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
	const container = document.createElement( 'div' );
	const waveformContainer = document.createElement( 'div' );
	waveformContainer.className = 'waveform-container';

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
		artworkEl.alt = options.imageAlt || '';
	}

	container.append( titleEl );
	if ( subtitleEl ) {
		container.append( subtitleEl );
	}
	if ( artworkEl ) {
		container.append( artworkEl );
	}
	container.append( waveformContainer );
	element.append( container );

	return {
		instance: { titleEl, subtitleEl, artworkEl },
		container,
		waveformContainer,
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
		expect( player.instance.subtitleEl ).toHaveTextContent( 'New Artist' );
		expect( player.instance.artworkEl ).toHaveAttribute(
			'src',
			'https://example.com/new.jpg'
		);
		expect( player.instance.artworkEl ).toHaveAttribute(
			'alt',
			'A black and white portrait'
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

	it( 'recreates the player when the color changes', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } color="#000000" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;
		expect( initWaveformPlayer.mock.calls[ 0 ][ 0 ] ).not.toHaveStyle( {
			color: '#000000',
		} );
		expect( applyWaveformPlayerStyles ).toHaveBeenLastCalledWith(
			player.container,
			expect.objectContaining( { color: '#000000' } )
		);

		rerender( <WaveformPlayer { ...baseProps } color="#ffffff" /> );

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		expect( player.destroy ).toHaveBeenCalledTimes( 1 );
		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 2 );
		const secondPlayer = initWaveformPlayer.mock.results[ 1 ].value;
		expect( initWaveformPlayer.mock.calls[ 1 ][ 0 ] ).not.toHaveStyle( {
			color: '#ffffff',
		} );
		expect( applyWaveformPlayerStyles ).toHaveBeenLastCalledWith(
			secondPlayer.container,
			expect.objectContaining( { color: '#ffffff' } )
		);
	} );

	it( 'updates the background color without recreating the player', () => {
		const { rerender } = render(
			<WaveformPlayer { ...baseProps } backgroundColor="#eeeeee" />
		);

		act( () => {
			jest.advanceTimersByTime( 100 );
		} );

		const player = initWaveformPlayer.mock.results[ 0 ].value;
		const element = initWaveformPlayer.mock.calls[ 0 ][ 0 ];
		expect( element ).not.toHaveStyle( {
			backgroundColor: '#eeeeee',
		} );
		expect( player.container ).not.toHaveStyle( {
			backgroundColor: '#eeeeee',
		} );
		expect( applyWaveformPlayerStyles ).toHaveBeenLastCalledWith(
			player.container,
			expect.objectContaining( { backgroundColor: '#eeeeee' } )
		);

		rerender(
			<WaveformPlayer { ...baseProps } backgroundColor="#222222" />
		);

		expect( initWaveformPlayer ).toHaveBeenCalledTimes( 1 );
		expect( player.destroy ).not.toHaveBeenCalled();
		expect( element ).not.toHaveStyle( {
			backgroundColor: '#222222',
		} );
		expect( player.container ).not.toHaveStyle( {
			backgroundColor: '#222222',
		} );
		expect( applyWaveformPlayerStyles ).toHaveBeenLastCalledWith(
			player.container,
			expect.objectContaining( { backgroundColor: '#222222' } )
		);
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
