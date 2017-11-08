/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { each } from 'lodash';

/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { NavigableGrid, TabbableContainer, NavigableMenu } from '../';

const { UP, DOWN, TAB, LEFT, RIGHT } = keycodes;

function simulateVisible( wrapper, selector ) {
	const elements = wrapper.getDOMNode().querySelectorAll( selector );
	each( elements, ( elem ) => {
		elem.getClientRects = () => [ 'trick-jsdom-into-having-size-for-element-rect' ];
	} );
}

function fireKeyDown( container, keyCode, shiftKey ) {
	container.simulate( 'keydown', {
		stopPropagation: () => {},
		preventDefault: () => {},
		nativeEvent: {
			stopImmediatePropagation: () => { },
		},
		keyCode,
		shiftKey,
	} );
}

describe( 'NavigableMenu', () => {
	it( 'vertical: should navigate by up and down', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu onNavigate={ ( index ) => currentIndex = index }>
				<button id="btn1">One</button>
				<button id="btn2">Two</button>
				<button id="btn3">Three</button>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 1 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( DOWN, 0 );
		assertKeyDown( UP, 2 );
		assertKeyDown( UP, 1 );
		assertKeyDown( UP, 0 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( RIGHT, 0 );
	} );

	it( 'vertical: should navigate by up and down, and skip deep candidates', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span id="btn-deep-wrapper">
					<span id="btn-deep" tabIndex="-1">Deep</span>
				</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 1 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( DOWN, 0 );
		assertKeyDown( UP, 2 );
		assertKeyDown( UP, 1 );
		assertKeyDown( UP, 0 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( RIGHT, 0 );
	} );

	it( 'vertical: should navigate by up and down, and explore deep candidates', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu deep={ true } orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span id="btn-deep-wrapper">
					<span id="btn-deep" tabIndex="-1">Deep</span>
				</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 1 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( DOWN, 3 );
		assertKeyDown( DOWN, 0 );
		assertKeyDown( UP, 3 );
		assertKeyDown( UP, 2 );
		assertKeyDown( UP, 1 );
		assertKeyDown( UP, 0 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( RIGHT, 0 );
	} );

	it( 'vertical: should navigate by up and down, and stop at edges', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu cycle={ false } orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( DOWN, 1 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( DOWN, 2 );
		assertKeyDown( UP, 1 );
		assertKeyDown( UP, 0 );
		assertKeyDown( UP, 0 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( RIGHT, 0 );
	} );

	it( 'horizontal: should navigate by left and right', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
				<button id="btn1">One</button>
				<button id="btn2">Two</button>
				<button id="btn3">Three</button>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( RIGHT, 1 );
		assertKeyDown( RIGHT, 2 );
		assertKeyDown( RIGHT, 0 );
		assertKeyDown( LEFT, 2 );
		assertKeyDown( LEFT, 1 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( UP, 0 );
		assertKeyDown( DOWN, 0 );
	} );

	it( 'horizontal: should navigate by left and right, and skip deep candidates', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span id="btn-deep-wrapper">
					<span id="btn-deep" tabIndex="-1">Deep</span>
				</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( RIGHT, 1 );
		assertKeyDown( RIGHT, 2 );
		assertKeyDown( RIGHT, 0 );
		assertKeyDown( LEFT, 2 );
		assertKeyDown( LEFT, 1 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( UP, 0 );
		assertKeyDown( DOWN, 0 );
	} );

	it( 'horizontal: should navigate by left and right, and explore deep candidates', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu deep={ true } orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span id="btn-deep-wrapper">
					<span id="btn-deep" tabIndex="-1">Deep</span>
				</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( RIGHT, 1 );
		assertKeyDown( RIGHT, 2 );
		assertKeyDown( RIGHT, 3 );
		assertKeyDown( RIGHT, 0 );
		assertKeyDown( LEFT, 3 );
		assertKeyDown( LEFT, 2 );
		assertKeyDown( LEFT, 1 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( UP, 0 );
		assertKeyDown( DOWN, 0 );
	} );

	it( 'horizontal: should navigate by left and right, and stop at edges', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<NavigableMenu cycle={ false } orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( RIGHT, 1 );
		assertKeyDown( RIGHT, 2 );
		assertKeyDown( RIGHT, 2 );
		assertKeyDown( LEFT, 1 );
		assertKeyDown( LEFT, 0 );
		assertKeyDown( LEFT, 0 );
	} );
} );

describe( 'TabbableContainer', () => {
	it( 'should navigate by keypresses', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<TabbableContainer className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
				<div className="section" id="section1" tabIndex="0">Section One</div>
				<div className="section" id="section2a" tabIndex="0">Section Two</div>
				<div className="section" id="section2b" tabIndex="-1">Section to Skip</div>
				<div className="section" id="section3" tabIndex="0">Section Three</div>
			</TabbableContainer >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div.wrapper' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( TAB, false, 1 );
		assertKeyDown( TAB, false, 2 );
		assertKeyDown( TAB, false, 0 );
		assertKeyDown( TAB, true, 2 );
		assertKeyDown( TAB, true, 1 );
		assertKeyDown( TAB, true, 0 );
	} );

	it( 'should navigate by keypresses and overlook deep candidates', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<TabbableContainer className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
				<div className="section" id="section1" tabIndex="0">Section One</div>
				<div className="section" id="section2" tabIndex="0">Section Two</div>
				<div className="deep-section">
					<div className="section" id="section-deep" tabIndex="0">Section to Skip</div>
				</div>
				<div className="section" id="section3" tabIndex="0">Section Three</div>
			</TabbableContainer >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div.wrapper' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( TAB, false, 1 );
		assertKeyDown( TAB, false, 2 );
		assertKeyDown( TAB, false, 0 );
		assertKeyDown( TAB, true, 2 );
		assertKeyDown( TAB, true, 1 );
		assertKeyDown( TAB, true, 0 );
	} );

	it( 'should navigate by keypresses and explore deep candidates', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<TabbableContainer deep={ true } className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
				<div className="section" id="section1" tabIndex="0">Section One</div>
				<div className="section" id="section2" tabIndex="0">Section Two</div>
				<div className="deep-section-wrapper">
					<div className="section" id="section-deep" tabIndex="0">Section to <strong>not</strong> skip</div>
				</div>
				<div className="section" id="section3" tabIndex="0">Section Three</div>
			</TabbableContainer >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div.wrapper' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( TAB, false, 1 );
		assertKeyDown( TAB, false, 2 );
		assertKeyDown( TAB, false, 3 );
		assertKeyDown( TAB, false, 0 );
		assertKeyDown( TAB, true, 3 );
		assertKeyDown( TAB, true, 2 );
		assertKeyDown( TAB, true, 1 );
		assertKeyDown( TAB, true, 0 );
	} );

	it( 'should navigate by keypresses and stop at edges', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			<TabbableContainer cycle={ false } className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
				<div className="section" id="section1" tabIndex="0">Section One</div>
				<div className="section" id="section2" tabIndex="0">Section Two</div>
				<div className="section" id="section3" tabIndex="0">Section Three</div>
			</TabbableContainer >
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div.wrapper' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
		}

		assertKeyDown( TAB, false, 1 );
		assertKeyDown( TAB, false, 2 );
		assertKeyDown( TAB, false, 2 );
		assertKeyDown( TAB, true, 1 );
		assertKeyDown( TAB, true, 0 );
		assertKeyDown( TAB, true, 0 );
	} );
} );
