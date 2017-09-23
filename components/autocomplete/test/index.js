/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import Autocomplete from '../';

const { ENTER, ESCAPE, UP, DOWN, SPACE } = keycodes;

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

	let getInputPosition;
	beforeAll( () => {
		getInputPosition = Autocomplete.prototype.getInputPosition;
		Autocomplete.prototype.getInputPosition = jest.fn( () => {
			return {
				top: 100,
				left: 100,
			};
		} );
	} );

	afterAll( () => {
		Autocomplete.prototype.getInputPosition = getInputPosition;
	} );

	describe( 'render()', () => {
		it( 'renders with cloned child', () => {
			const input = <div data-ok="true" contentEditable />;
			const wrapper = shallow(
				<Autocomplete options={ options } className="my-autocomplete">
					{ input }
				</Autocomplete>
			);
			const popover = wrapper.find( 'Popover' );

			expect( wrapper.state( 'isOpen' ) ).toBe( false );
			expect( popover.hasClass( 'my-autocomplete' ) ).toBe( true );
			expect( popover.hasClass( 'components-autocomplete__popover' ) ).toBe( true );
			expect( wrapper.hasClass( 'components-autocomplete' ) ).toBe( true );
			expect( wrapper.find( '[data-ok]' ) ).toHaveLength( 1 );
		} );

		it( 'opens on absent trigger prefix search', () => {
			const wrapper = shallow(
				<Autocomplete options={ options }>
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: 'b',
				},
			} );

			expect( wrapper.state( 'isOpen' ) ).toBe( true );
			expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
			expect( wrapper.state( 'search' ) ).toEqual( /b/i );
			expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 1 );
		} );

		it( 'opens on trigger prefix search', () => {
			const wrapper = shallow(
				<Autocomplete options={ options } triggerPrefix="/">
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: 'b',
				},
			} );

			expect( wrapper.state( 'isOpen' ) ).toBe( false );

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/',
				},
			} );

			expect( wrapper.state( 'isOpen' ) ).toBe( true );
			expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
			expect( wrapper.state( 'search' ) ).toEqual( new RegExp( '', 'i' ) );
			expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 2 );
		} );

		it( 'searches by keywords', () => {
			const wrapper = shallow(
				<Autocomplete options={ options }>
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: 'fruit',
				},
			} );

			expect( wrapper.find( '.components-autocomplete__result' ) ).toHaveLength( 2 );
		} );

		it( 'closes when search ends (whitespace)', () => {
			const wrapper = shallow(
				<Autocomplete options={ options }>
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: 'b',
				},
			} );

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: 'b ',
				},
			} );

			expect( wrapper.state( 'isOpen' ) ).toBe( false );
		} );

		it( 'navigates options by arrow keys', () => {
			const preventDefault = jest.fn();
			const stopImmediatePropagation = jest.fn();
			const wrapper = shallow(
				<Autocomplete options={ options } triggerPrefix="/">
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/',
				},
			} );

			wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
				keyCode: DOWN,
				preventDefault,
				stopImmediatePropagation,
			} );

			expect( wrapper.state( 'selectedIndex' ) ).toBe( 1 );

			wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
				keyCode: DOWN,
				preventDefault,
				stopImmediatePropagation,
			} );

			expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );

			expect( preventDefault ).toHaveBeenCalled();
			expect( stopImmediatePropagation ).toHaveBeenCalled();
		} );

		it( 'resets selected index on subsequent search', () => {
			const preventDefault = jest.fn();
			const stopImmediatePropagation = jest.fn();
			const wrapper = shallow(
				<Autocomplete options={ options } triggerPrefix="/">
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/',
				},
			} );

			wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
				keyCode: DOWN,
				preventDefault,
				stopImmediatePropagation,
			} );

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/f',
				},
			} );

			expect( wrapper.state( 'selectedIndex' ) ).toBe( 0 );
		} );

		it( 'closes by escape', () => {
			const preventDefault = jest.fn();
			const stopImmediatePropagation = jest.fn();
			const wrapper = shallow(
				<Autocomplete options={ options } triggerPrefix="/"
				>
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/',
				},
			} );

			wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
				keyCode: ESCAPE,
				preventDefault,
				stopImmediatePropagation,
			} );

			expect( wrapper.state() ).toEqual( Autocomplete.getInitialState() );

			expect( preventDefault ).toHaveBeenCalled();
			expect( stopImmediatePropagation ).toHaveBeenCalled();
		} );

		it( 'selects by enter', () => {
			const preventDefault = jest.fn();
			const stopImmediatePropagation = jest.fn();
			const onSelect = jest.fn();
			const wrapper = shallow(
				<Autocomplete
					options={ options }
					triggerPrefix="/"
					onSelect={ onSelect }
				>
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/',
				},
			} );

			wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
				keyCode: ENTER,
				preventDefault,
				stopImmediatePropagation,
			} );

			expect( wrapper.state() ).toEqual( Autocomplete.getInitialState() );
			expect( preventDefault ).toHaveBeenCalled();
			expect( stopImmediatePropagation ).toHaveBeenCalled();
			expect( onSelect ).toHaveBeenCalledWith( options[ 0 ] );
		} );

		it( 'doesn\'t otherwise interfere with keydown behavior', () => {
			const preventDefault = jest.fn();
			const stopImmediatePropagation = jest.fn();
			const onSelect = jest.fn();
			const wrapper = shallow(
				<Autocomplete
					options={ options }
					triggerPrefix="/"
					onSelect={ onSelect }
				>
					<div contentEditable />
				</Autocomplete>
			);

			[ UP, DOWN, ENTER, ESCAPE, SPACE ].forEach( ( keyCode ) => {
				wrapper.find( '[contentEditable]' ).simulate( 'keydown', {
					keyCode,
					preventDefault,
					stopImmediatePropagation,
				} );
			} );

			expect( preventDefault ).not.toHaveBeenCalled();
			expect( stopImmediatePropagation ).not.toHaveBeenCalled();
		} );

		it( 'selects by click on result', () => {
			const onSelect = jest.fn();
			const wrapper = shallow(
				<Autocomplete
					options={ options }
					triggerPrefix="/"
					onSelect={ onSelect }
				>
					<div contentEditable />
				</Autocomplete>
			);

			wrapper.find( '[contentEditable]' ).simulate( 'input', {
				target: {
					textContent: '/',
				},
			} );

			wrapper.find( '.components-autocomplete__result Button' ).at( 0 ).simulate( 'click' );

			expect( wrapper.state() ).toEqual( Autocomplete.getInitialState() );
			expect( onSelect ).toHaveBeenCalledWith( options[ 0 ] );
		} );
	} );
} );
