/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * WordPress dependencies
 */
// import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import Autocomplete from '../';

// const { ENTER, ESCAPE, UP, DOWN, SPACE } = keycodes;

describe( 'Autocomplete', () => {
	const options = [
		{
			value: 1,
			label: 'Bananas',
			keywords: [ 'fruit' ],
		},
		{
			value: 2,
			label: 'Apple',
			keywords: [ 'fruit' ],
		},
	];

	const basicCompleter = {
		getOptions: () => Promise.resolve( options ),
	};

	const slashCompleter = {
		triggerPrefix: '/',
		getOptions: () => Promise.resolve( options ),
	};

	let getCursor, createRange;
	beforeAll( () => {
		getCursor = Autocomplete.prototype.getCursor;
		Autocomplete.prototype.getCursor = jest.fn( ( container ) => {
			return {
				node: container,
				offset: container.childNodes.length,
			};
		} );
		createRange = Autocomplete.prototype.createRange;
		Autocomplete.prototype.createRange = jest.fn( ( startNode, startOffset, endNode, endOffset ) => {
			const fakeBounds = { x: 0, y: 0, width: 1, height: 1, top: 0, right: 1, bottom: 1, left: 0 };
			return {
				startNode,
				startOffset,
				endNode,
				endOffset,
				getClientRects: () => [ fakeBounds ],
				getBoundingClientRect: () => fakeBounds,
			};
		} );
	} );

	afterAll( () => {
		Autocomplete.prototype.getCursor = getCursor;
		Autocomplete.prototype.createRange = createRange;
	} );

	describe( 'render()', () => {
		it( 'with no completers it just exists', () => {
			const wrapper = mount(
				<Autocomplete completers={ [ ] }>
					<div data-ok="true" contentEditable />
				</Autocomplete>
			);

			expect( wrapper.state().open ).toBe( null );
			expect( wrapper.find( 'Popover' ).props().focusOnOpen ).toBe( false );
			expect( wrapper.hasClass( 'components-autocomplete' ) ).toBe( true );
			expect( wrapper.find( '[data-ok]' ) ).toHaveLength( 1 );
		} );

		it( 'opens on absent trigger prefix search', ( done ) => {
			const wrapper = mount(
				<Autocomplete completers={ [ basicCompleter ] }>
					<div contentEditable suppressContentEditableWarning>b</div>
				</Autocomplete>
			);
			// wait for getOptions promise
			process.nextTick( () => {
				// check the initial state
				expect( wrapper.state( 'open' ) ).toEqual( null );
				expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
				expect( wrapper.state( 'lookup' ) ).toEqual( null );
				expect( wrapper.state( 'search' ) ).toEqual( /./ );
				expect( wrapper.instance().getFilteredOptions() ).toEqual( [] );
				expect( wrapper.find( 'Popover' ).prop( 'isOpen' ) ).toBe( false );
				expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 0 );
				// simulate the input event
				wrapper.find( '[contentEditable]' ).simulate( 'input', {
					target: wrapper.getDOMNode().querySelector( '[contentEditable]' ),
				} );
				// now check that we've opened the popup and filtered the options
				expect( wrapper.state( 'open' ) ).toBeDefined();
				expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
				expect( wrapper.state( 'lookup' ) ).toEqual( 'b' );
				expect( wrapper.state( 'search' ) ).toEqual( /b/i );
				expect( wrapper.instance().getFilteredOptions() ).toEqual( [ {
					key: 0,
					value: 1,
					label: 'Bananas',
					keywords: [ 'fruit' ],
				} ] );
				expect( wrapper.find( 'Popover' ).prop( 'isOpen' ) ).toBe( true );
				expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 1 );
				done();
			} );
		} );

		it( 'does not render popover as open if no results', ( done ) => {
			const wrapper = mount(
				<Autocomplete completers={ [ basicCompleter ] }>
					<div contentEditable suppressContentEditableWarning>zzz</div>
				</Autocomplete>
			);
			// wait for getOptions promise
			process.nextTick( () => {
				// check the initial state
				expect( wrapper.state( 'open' ) ).toEqual( null );
				expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
				expect( wrapper.state( 'lookup' ) ).toEqual( null );
				expect( wrapper.state( 'search' ) ).toEqual( /./ );
				expect( wrapper.instance().getFilteredOptions() ).toEqual( [] );
				expect( wrapper.find( 'Popover' ).prop( 'isOpen' ) ).toBe( false );
				expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 0 );
				// simulate the input event
				wrapper.find( '[contentEditable]' ).simulate( 'input', {
					target: wrapper.getDOMNode().querySelector( '[contentEditable]' ),
				} );
				// now check that we've opened the popup and filtered the options
				expect( wrapper.state( 'open' ) ).toBeDefined();
				expect( wrapper.state( 'lookup' ) ).toEqual( 'zzz' );
				expect( wrapper.state( 'search' ) ).toEqual( /zzz/i );
				expect( wrapper.instance().getFilteredOptions() ).toEqual( [] );
				expect( wrapper.find( 'Popover' ).prop( 'isOpen' ) ).toBe( false );
				expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 0 );
				done();
			} );
		} );

		it( 'does not open without trigger prefix', ( done ) => {
			const wrapper = mount(
				<Autocomplete completers={ [ slashCompleter ] }>
					<div contentEditable suppressContentEditableWarning>b</div>
				</Autocomplete>
			);
			// wait for getOptions promise
			process.nextTick( () => {
				// check the initial state
				expect( wrapper.state( 'open' ) ).toEqual( null );
				expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
				expect( wrapper.state( 'lookup' ) ).toEqual( null );
				expect( wrapper.state( 'search' ) ).toEqual( /./ );
				expect( wrapper.instance().getFilteredOptions() ).toEqual( [] );
				expect( wrapper.find( 'Popover' ).prop( 'isOpen' ) ).toBe( false );
				expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 0 );
				// simulate the input event
				wrapper.find( '[contentEditable]' ).simulate( 'input', {
					target: wrapper.getDOMNode().querySelector( '[contentEditable]' ),
				} );
				// now check that we've opened the popup and filtered the options
				expect( wrapper.state( 'open' ) ).toEqual( null );
				expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
				expect( wrapper.state( 'lookup' ) ).toEqual( null );
				expect( wrapper.state( 'search' ) ).toEqual( /./ );
				expect( wrapper.instance().getFilteredOptions() ).toEqual( [] );
				expect( wrapper.find( 'Popover' ).prop( 'isOpen' ) ).toBe( false );
				expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 0 );
				done();
			} );
		} );
		// it( 'opens on trigger prefix search', () => {
		// 	const wrapper = shallow(
		// 		<Autocomplete options={ options } triggerPrefix="/">
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: 'b',
		// 		},
		// 	} );

		// 	expect( wrapper.state( 'isOpen' ) ).toBe( false );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/',
		// 		},
		// 	} );

		// 	expect( wrapper.state( 'isOpen' ) ).toBe( true );
		// 	expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
		// 	expect( wrapper.state( 'search' ) ).toEqual( new RegExp( '', 'i' ) );
		// 	expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 2 );
		// } );

		// it( 'searches by keywords', () => {
		// 	const wrapper = shallow(
		// 		<Autocomplete options={ options }>
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: 'fruit',
		// 		},
		// 	} );

		// 	expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 2 );
		// } );

		// it( 'closes when search ends (whitespace)', () => {
		// 	const wrapper = shallow(
		// 		<Autocomplete options={ options }>
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: 'b',
		// 		},
		// 	} );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: 'b ',
		// 		},
		// 	} );

		// 	expect( wrapper.state( 'isOpen' ) ).toBe( false );
		// } );

		// it( 'navigates options by arrow keys', () => {
		// 	const preventDefault = jest.fn();
		// 	const stopImmediatePropagation = jest.fn();
		// 	const wrapper = shallow(
		// 		<Autocomplete options={ options } triggerPrefix="/">
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/',
		// 		},
		// 	} );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
		// 		keyCode: DOWN,
		// 		preventDefault,
		// 		stopImmediatePropagation,
		// 	} );

		// 	expect( wrapper.state( 'selectedIndex' ) ).toBe( 1 );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
		// 		keyCode: DOWN,
		// 		preventDefault,
		// 		stopImmediatePropagation,
		// 	} );

		// 	expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );

		// 	expect( preventDefault ).toHaveBeenCalled();
		// 	expect( stopImmediatePropagation ).toHaveBeenCalled();
		// } );

		// it( 'resets selected index on subsequent search', () => {
		// 	const preventDefault = jest.fn();
		// 	const stopImmediatePropagation = jest.fn();
		// 	const wrapper = shallow(
		// 		<Autocomplete options={ options } triggerPrefix="/">
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/',
		// 		},
		// 	} );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
		// 		keyCode: DOWN,
		// 		preventDefault,
		// 		stopImmediatePropagation,
		// 	} );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/f',
		// 		},
		// 	} );

		// 	expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
		// } );

		// it( 'closes by escape', () => {
		// 	const preventDefault = jest.fn();
		// 	const stopImmediatePropagation = jest.fn();
		// 	const wrapper = shallow(
		// 		<Autocomplete options={ options } triggerPrefix="/">
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/',
		// 		},
		// 	} );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
		// 		keyCode: ESCAPE,
		// 		preventDefault,
		// 		stopImmediatePropagation,
		// 	} );

		// 	expect( wrapper.state() ).toEqual( Autocomplete.getInitialState() );

		// 	expect( preventDefault ).toHaveBeenCalled();
		// 	expect( stopImmediatePropagation ).toHaveBeenCalled();
		// } );

		// it( 'selects by enter', () => {
		// 	const preventDefault = jest.fn();
		// 	const stopImmediatePropagation = jest.fn();
		// 	const onSelect = jest.fn();
		// 	const wrapper = shallow(
		// 		<Autocomplete
		// 			options={ options }
		// 			triggerPrefix="/"
		// 			onSelect={ onSelect }
		// 		>
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/',
		// 		},
		// 	} );

		// 	wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
		// 		keyCode: ENTER,
		// 		preventDefault,
		// 		stopImmediatePropagation,
		// 	} );

		// 	expect( wrapper.state() ).toEqual( Autocomplete.getInitialState() );
		// 	expect( preventDefault ).toHaveBeenCalled();
		// 	expect( stopImmediatePropagation ).toHaveBeenCalled();
		// 	expect( onSelect ).toHaveBeenCalledWith( options[ 0 ] );
		// } );

		// it( 'doesn\'t otherwise interfere with keydown behavior', () => {
		// 	const preventDefault = jest.fn();
		// 	const stopImmediatePropagation = jest.fn();
		// 	const onSelect = jest.fn();
		// 	const wrapper = shallow(
		// 		<Autocomplete
		// 			options={ options }
		// 			triggerPrefix="/"
		// 			onSelect={ onSelect }
		// 		>
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	[ UP, DOWN, ENTER, ESCAPE, SPACE ].forEach( ( keyCode ) => {
		// 		wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
		// 			keyCode,
		// 			preventDefault,
		// 			stopImmediatePropagation,
		// 		} );
		// 	} );

		// 	expect( preventDefault ).not.toHaveBeenCalled();
		// 	expect( stopImmediatePropagation ).not.toHaveBeenCalled();
		// } );

		// it( 'selects by click on result', () => {
		// 	const onSelect = jest.fn();
		// 	const wrapper = shallow(
		// 		<Autocomplete
		// 			options={ options }
		// 			triggerPrefix="/"
		// 			onSelect={ onSelect }
		// 		>
		// 			<div contentEditable />
		// 		</Autocomplete>
		// 	);

		// 	wrapper.find( '[contentEditable]' ).simulate( 'input', {
		// 		target: {
		// 			textContent: '/',
		// 		},
		// 	} );

		// 	wrapper.find( '.components-autocomplete__result Button' ).at( 0 ).simulate( 'click' );

		// 	expect( wrapper.state() ).toEqual( Autocomplete.getInitialState() );
		// 	expect( onSelect ).toHaveBeenCalledWith( options[ 0 ] );
		// } );
	} );
} );
