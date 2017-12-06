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
import { TabbableContainer, NavigableMenu } from '../';

const { UP, DOWN, TAB, LEFT, RIGHT, SPACE } = keycodes;

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

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu onNavigate={ ( index ) => currentIndex = index }>
					<button id="btn1">One</button>
					<button id="btn2">Two</button>
					<button id="btn3">Three</button>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( DOWN, 1, 0 );
		assertKeyDown( DOWN, 2, 0 );
		assertKeyDown( DOWN, 0, 0 );
		assertKeyDown( UP, 2, 0 );
		assertKeyDown( UP, 1, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( RIGHT, 0, 0 );
		assertKeyDown( SPACE, 0, 1 );
	} );

	it( 'vertical: should navigate by up and down, and skip deep candidates', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
					<span tabIndex="-1" id="btn1">One</span>
					<span tabIndex="-1" id="btn2">Two</span>
					<span id="btn-deep-wrapper">
						<span id="btn-deep" tabIndex="-1">Deep</span>
					</span>
					<span tabIndex="-1" id="btn3">Three</span>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( DOWN, 1, 0 );
		assertKeyDown( DOWN, 2, 0 );
		assertKeyDown( DOWN, 0, 0 );
		assertKeyDown( UP, 2, 0 );
		assertKeyDown( UP, 1, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( RIGHT, 0, 0 );
	} );

	it( 'vertical: should navigate by up and down, and explore deep candidates', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu deep={ true } orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
					<span tabIndex="-1" id="btn1">One</span>
					<span tabIndex="-1" id="btn2">Two</span>
					<span id="btn-deep-wrapper">
						<span id="btn-deep" tabIndex="-1">Deep</span>
					</span>
					<span tabIndex="-1" id="btn3">Three</span>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( DOWN, 1, 0 );
		assertKeyDown( DOWN, 2, 0 );
		assertKeyDown( DOWN, 3, 0 );
		assertKeyDown( DOWN, 0, 0 );
		assertKeyDown( UP, 3, 0 );
		assertKeyDown( UP, 2, 0 );
		assertKeyDown( UP, 1, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( RIGHT, 0, 0 );
	} );

	it( 'vertical: should navigate by up and down, and stop at edges', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu cycle={ false } orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
					<span tabIndex="-1" id="btn1">One</span>
					<span tabIndex="-1" id="btn2">Two</span>
					<span tabIndex="-1" id="btn3">Three</span>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( DOWN, 1, 0 );
		assertKeyDown( DOWN, 2, 0 );
		assertKeyDown( DOWN, 2, 0 );
		assertKeyDown( UP, 1, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( RIGHT, 0, 0 );
	} );

	it( 'horizontal: should navigate by left and right', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
					<button id="btn1">One</button>
					<button id="btn2">Two</button>
					<button id="btn3">Three</button>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( RIGHT, 1, 0 );
		assertKeyDown( RIGHT, 2, 0 );
		assertKeyDown( RIGHT, 0, 0 );
		assertKeyDown( LEFT, 2, 0 );
		assertKeyDown( LEFT, 1, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( DOWN, 0, 0 );
	} );

	it( 'horizontal: should navigate by left and right, and skip deep candidates', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
					<span tabIndex="-1" id="btn1">One</span>
					<span tabIndex="-1" id="btn2">Two</span>
					<span id="btn-deep-wrapper">
						<span id="btn-deep" tabIndex="-1">Deep</span>
					</span>
					<span tabIndex="-1" id="btn3">Three</span>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( RIGHT, 1, 0 );
		assertKeyDown( RIGHT, 2, 0 );
		assertKeyDown( RIGHT, 0, 0 );
		assertKeyDown( LEFT, 2, 0 );
		assertKeyDown( LEFT, 1, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( DOWN, 0, 0 );
	} );

	it( 'horizontal: should navigate by left and right, and explore deep candidates', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu deep={ true } orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
					<span tabIndex="-1" id="btn1">One</span>
					<span tabIndex="-1" id="btn2">Two</span>
					<span id="btn-deep-wrapper">
						<span id="btn-deep" tabIndex="-1">Deep</span>
					</span>
					<span tabIndex="-1" id="btn3">Three</span>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( RIGHT, 1, 0 );
		assertKeyDown( RIGHT, 2, 0 );
		assertKeyDown( RIGHT, 3, 0 );
		assertKeyDown( RIGHT, 0, 0 );
		assertKeyDown( LEFT, 3, 0 );
		assertKeyDown( LEFT, 2, 0 );
		assertKeyDown( LEFT, 1, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( UP, 0, 0 );
		assertKeyDown( DOWN, 0, 0 );
	} );

	it( 'horizontal: should navigate by left and right, and stop at edges', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<NavigableMenu cycle={ false } orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
					<span tabIndex="-1" id="btn1">One</span>
					<span tabIndex="-1" id="btn2">Two</span>
					<span tabIndex="-1" id="btn3">Three</span>
				</NavigableMenu >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container NavigableMenu' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( RIGHT, 1, 0 );
		assertKeyDown( RIGHT, 2, 0 );
		assertKeyDown( RIGHT, 2, 0 );
		assertKeyDown( LEFT, 1, 0 );
		assertKeyDown( LEFT, 0, 0 );
		assertKeyDown( LEFT, 0, 0 );
	} );
} );

describe( 'TabbableContainer', () => {
	it( 'should navigate by keypresses', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<TabbableContainer className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
					<div className="section" id="section1" tabIndex="0">Section One</div>
					<div className="section" id="section2a" tabIndex="0">Section Two</div>
					<div className="section" id="section2b" tabIndex="-1">Section to Skip</div>
					<div className="section" id="section3" tabIndex="0">Section Three</div>
				</TabbableContainer >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container TabbableContainer' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( TAB, false, 1, 0 );
		assertKeyDown( TAB, false, 2, 0 );
		assertKeyDown( TAB, false, 0, 0 );
		assertKeyDown( TAB, true, 2, 0 );
		assertKeyDown( TAB, true, 1, 0 );
		assertKeyDown( TAB, true, 0, 0 );
	} );

	it( 'should navigate by keypresses and overlook deep candidates', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<TabbableContainer className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
					<div className="section" id="section1" tabIndex="0">Section One</div>
					<div className="section" id="section2" tabIndex="0">Section Two</div>
					<div className="deep-section">
						<div className="section" id="section-deep" tabIndex="0">Section to Skip</div>
					</div>
					<div className="section" id="section3" tabIndex="0">Section Three</div>
				</TabbableContainer >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container TabbableContainer' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( TAB, false, 1, 0 );
		assertKeyDown( TAB, false, 2, 0 );
		assertKeyDown( TAB, false, 0, 0 );
		assertKeyDown( TAB, true, 2, 0 );
		assertKeyDown( TAB, true, 1, 0 );
		assertKeyDown( TAB, true, 0, 0 );
	} );

	it( 'should navigate by keypresses and explore deep candidates', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<TabbableContainer deep={ true } className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
					<div className="section" id="section1" tabIndex="0">Section One</div>
					<div className="section" id="section2" tabIndex="0">Section Two</div>
					<div className="deep-section-wrapper">
						<div className="section" id="section-deep" tabIndex="0">Section to <strong>not</strong> skip</div>
					</div>
					<div className="section" id="section3" tabIndex="0">Section Three</div>
				</TabbableContainer >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container TabbableContainer' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( TAB, false, 1, 0 );
		assertKeyDown( TAB, false, 2, 0 );
		assertKeyDown( TAB, false, 3, 0 );
		assertKeyDown( TAB, false, 0, 0 );
		assertKeyDown( TAB, true, 3, 0 );
		assertKeyDown( TAB, true, 2, 0 );
		assertKeyDown( TAB, true, 1, 0 );
		assertKeyDown( TAB, true, 0, 0 );
	} );

	it( 'should navigate by keypresses and stop at edges', () => {
		let currentIndex = 0;

		let numKeyDowns = 0;
		const onOuterKeyDown = () => {
			numKeyDowns++;
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		const wrapper = mount( (
			<div className="outer-container" onKeyDown={ onOuterKeyDown }>
				<TabbableContainer cycle={ false } className="wrapper" onNavigate={ ( index ) => currentIndex = index }>
					<div className="section" id="section1" tabIndex="0">Section One</div>
					<div className="section" id="section2" tabIndex="0">Section Two</div>
					<div className="section" id="section3" tabIndex="0">Section Three</div>
				</TabbableContainer >
			</div>
		) );
		/* eslint-enable jsx-a11y/no-static-element-interactions */

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( '.outer-container TabbableContainer' );
		wrapper.getDOMNode().querySelector( '#section1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, shiftKey, expectedActiveIndex, expectedEventCount ) {
			fireKeyDown( container, keyCode, shiftKey );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( numKeyDowns ).toBe( expectedEventCount );
		}

		assertKeyDown( TAB, false, 1, 0 );
		assertKeyDown( TAB, false, 2, 0 );
		assertKeyDown( TAB, false, 2, 0 );
		assertKeyDown( TAB, true, 1, 0 );
		assertKeyDown( TAB, true, 0, 0 );
		assertKeyDown( TAB, true, 0, 0 );
	} );
} );
