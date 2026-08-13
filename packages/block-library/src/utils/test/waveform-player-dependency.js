import '@testing-library/jest-dom';

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
	const documentElement = document.documentElement;
	const hadAutoinitAttribute = documentElement.hasAttribute(
		'data-waveform-autoinit'
	);
	const previousAutoinitValue = documentElement.getAttribute(
		'data-waveform-autoinit'
	);

	jest.isolateModules( () => {
		documentElement.setAttribute( 'data-waveform-autoinit', 'false' );
		WaveformPlayer = require( '@arraypress/waveform-player' ).default;
	} );

	if ( hadAutoinitAttribute ) {
		documentElement.setAttribute(
			'data-waveform-autoinit',
			previousAutoinitValue
		);
	} else {
		documentElement.removeAttribute( 'data-waveform-autoinit' );
	}

	return WaveformPlayer;
}

function getFragmentedAttributeValue( prefix = '' ) {
	return `${ prefix }" ${ FIXTURE_ATTRIBUTE }="sample`;
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
		jest.dontMock( '@arraypress/waveform-player' );
		document.body.innerHTML = '';
		document.documentElement.removeAttribute( 'data-waveform-autoinit' );
		delete window.WaveformPlayer;
		WaveformPlayer = undefined;

		if ( originalReadyState ) {
			Object.defineProperty( document, 'readyState', originalReadyState );
		} else {
			delete document.readyState;
		}
	} );

	it( 'disables dependency auto-init before loading the Playlist utility', () => {
		const observedAutoinitValues = [];

		jest.isolateModules( () => {
			jest.doMock( '@arraypress/waveform-player', () => {
				observedAutoinitValues.push(
					document.documentElement.getAttribute(
						'data-waveform-autoinit'
					)
				);

				class MockWaveformPlayer {}

				return {
					__esModule: true,
					default: MockWaveformPlayer,
				};
			} );

			require( '../waveform-utils' );
		} );

		expect( observedAutoinitValues ).toEqual( [ 'false' ] );
		expect( document.documentElement ).not.toHaveAttribute(
			'data-waveform-autoinit'
		);
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
		expect( console ).toHaveWarnedWith(
			'[WaveformPlayer] Invalid buttonAlign option, using default:',
			getFragmentedAttributeValue( 'center' )
		);
	} );

	it( 'uses supported playback rates from declarative rate lists', () => {
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
		expect( options.map( ( option ) => option.textContent ) ).toEqual( [
			'1x',
			'1.5x',
		] );
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

	it( 'skips programmatic players during explicit declarative scans', () => {
		const element = createDeclarativePlayer();
		const icon = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		icon.setAttribute( FIXTURE_ATTRIBUTE, 'constructor-scan' );

		WaveformPlayer = loadWaveformPlayer();
		const player = new WaveformPlayer( element, {
			playIcon: icon.outerHTML,
		} );

		WaveformPlayer.init();

		expect( WaveformPlayer.getAllInstances() ).toHaveLength( 1 );
		expect( WaveformPlayer.getInstance( element ) ).toBe( player );
		expect(
			element.querySelector(
				`[${ FIXTURE_ATTRIBUTE }="constructor-scan"]`
			)
		).not.toBeNull();
	} );

	it( 'initializes declarative players only after an explicit request from the Playlist utility', () => {
		const element = createDeclarativePlayer( {
			'data-play-icon':
				'<img src="invalid" onerror="window.__waveformXss = true">',
		} );

		jest.isolateModules( () => {
			require( '../waveform-utils' );
			WaveformPlayer = window.WaveformPlayer;
		} );

		expect( element ).not.toHaveAttribute( 'data-waveform-initialized' );
		expect( element ).toBeEmptyDOMElement();
		expect( document.documentElement ).not.toHaveAttribute(
			'data-waveform-autoinit'
		);

		WaveformPlayer.init();

		expect( element ).toHaveAttribute(
			'data-waveform-initialized',
			'true'
		);
		expect(
			element.querySelector( '.waveform-player-inner' )
		).not.toBeNull();
	} );

	it( 'preserves the page auto-init setting after loading the Playlist utility', () => {
		document.documentElement.setAttribute(
			'data-waveform-autoinit',
			'application-value'
		);

		jest.isolateModules( () => {
			require( '../waveform-utils' );
			WaveformPlayer = window.WaveformPlayer;
		} );

		expect( document.documentElement ).toHaveAttribute(
			'data-waveform-autoinit',
			'application-value'
		);
	} );
} );
