import '@testing-library/jest-dom';

const DEFAULT_PLAYBACK_RATES = [
	'0.5x',
	'0.75x',
	'1x',
	'1.25x',
	'1.5x',
	'1.75x',
	'2x',
];
const FIXTURE_ATTRIBUTE = 'data-player-fixture';

function createDeclarativePlayer( attributes = {} ) {
	const element = document.createElement( 'div' );
	element.setAttribute( 'data-waveform-player', '' );

	for ( const [ name, value ] of Object.entries( attributes ) ) {
		element.setAttribute( name, value );
	}

	document.body.appendChild( element );
	return element;
}

function loadWaveformPlayer() {
	let WaveformPlayer;

	jest.isolateModules( () => {
		WaveformPlayer = require( '@arraypress/waveform-player' ).default;
	} );

	return WaveformPlayer;
}

function getFragmentedAttributeValue( prefix = '' ) {
	const quotationMark = String.fromCharCode( 34 );

	return [
		prefix,
		quotationMark,
		' ',
		FIXTURE_ATTRIBUTE,
		'=',
		quotationMark,
		'sample',
	].join( '' );
}

describe( 'Waveform Player dependency', () => {
	let WaveformPlayer;
	let originalReadyState;
	let jsdomStubs;

	beforeEach( () => {
		jest.useFakeTimers();
		originalReadyState = Object.getOwnPropertyDescriptor(
			document,
			'readyState'
		);
		Object.defineProperty( document, 'readyState', {
			configurable: true,
			value: 'complete',
		} );

		jsdomStubs = [
			jest
				.spyOn( window.HTMLCanvasElement.prototype, 'getContext' )
				.mockReturnValue( null ),
			jest
				.spyOn( window.HTMLMediaElement.prototype, 'pause' )
				.mockImplementation( () => {} ),
			jest
				.spyOn( window.HTMLMediaElement.prototype, 'load' )
				.mockImplementation( () => {} ),
		];
	} );

	afterEach( () => {
		WaveformPlayer?.destroyAll();
		jsdomStubs.forEach( ( stub ) => stub.mockRestore() );
		jest.useRealTimers();
		jest.resetModules();
		document.body.innerHTML = '';
		delete window.WaveformPlayer;

		if ( originalReadyState ) {
			Object.defineProperty( document, 'readyState', originalReadyState );
		} else {
			delete document.readyState;
		}
	} );

	it( 'uses the default control icons when declarative icon values are unsupported', () => {
		const openingBracket = String.fromCharCode( 60 );
		const closingBracket = String.fromCharCode( 62 );
		const iconValue = [
			openingBracket,
			'span ',
			FIXTURE_ATTRIBUTE,
			closingBracket,
			openingBracket,
			'/span',
			closingBracket,
		].join( '' );
		const element = createDeclarativePlayer( {
			'data-play-icon': iconValue,
			'data-pause-icon': iconValue,
		} );

		WaveformPlayer = loadWaveformPlayer();
		WaveformPlayer.init();

		expect(
			element.querySelector( `[${ FIXTURE_ATTRIBUTE }]` )
		).toBeNull();
		expect(
			element.querySelector( '.waveform-icon-play svg' )
		).not.toBeNull();
		expect(
			element.querySelector( '.waveform-icon-pause svg' )
		).not.toBeNull();
	} );

	it( 'uses the default alignment when a declarative alignment value is unsupported', () => {
		const element = createDeclarativePlayer( {
			'data-button-align': getFragmentedAttributeValue( 'center' ),
		} );

		WaveformPlayer = loadWaveformPlayer();
		WaveformPlayer.init();

		const track = element.querySelector( '.waveform-track' );
		expect( track ).toHaveClass( 'waveform-align-center' );
		expect( track ).not.toHaveAttribute( FIXTURE_ATTRIBUTE );
	} );

	it( 'uses the default playback rates when a declarative rate list is unsupported', () => {
		const element = createDeclarativePlayer( {
			'data-show-playback-speed': 'true',
			'data-playback-rates': JSON.stringify( [
				1,
				getFragmentedAttributeValue( '1' ),
				1.5,
			] ),
		} );

		WaveformPlayer = loadWaveformPlayer();
		WaveformPlayer.init();

		const options = [ ...element.querySelectorAll( '.speed-option' ) ];
		expect( options.map( ( option ) => option.textContent ) ).toEqual(
			DEFAULT_PLAYBACK_RATES
		);
		expect(
			options.some( ( option ) =>
				option.hasAttribute( FIXTURE_ATTRIBUTE )
			)
		).toBe( false );
	} );

	it( 'supports custom control icons passed to the constructor', () => {
		const element = document.createElement( 'div' );
		const icon = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		icon.setAttribute( FIXTURE_ATTRIBUTE, 'constructor' );
		document.body.appendChild( element );

		WaveformPlayer = loadWaveformPlayer();
		new WaveformPlayer( element, {
			playIcon: icon.outerHTML,
		} );

		expect(
			element.querySelector( `[${ FIXTURE_ATTRIBUTE }="constructor"]` )
		).not.toBeNull();
	} );

	it( 'initializes declarative players only after an explicit request', () => {
		const element = createDeclarativePlayer();

		WaveformPlayer = loadWaveformPlayer();

		expect( element ).not.toHaveAttribute( 'data-waveform-initialized' );
		expect( element ).toBeEmptyDOMElement();

		WaveformPlayer.init();

		expect( element ).toHaveAttribute(
			'data-waveform-initialized',
			'true'
		);
		expect(
			element.querySelector( '.waveform-player-inner' )
		).not.toBeNull();
	} );
} );
