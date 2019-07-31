/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { each } from 'lodash';

/**
 * WordPress dependencies
 */
import { UP, DOWN, LEFT, RIGHT, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../menu';

function simulateVisible( wrapper, selector ) {
	const elements = wrapper.getDOMNode().querySelectorAll( selector );
	each( elements, ( elem ) => {
		elem.getClientRects = () => [ 'trick-jsdom-into-having-size-for-element-rect' ];
	} );
}

function fireKeyDown( container, keyCode, shiftKey ) {
	const interaction = {
		stopped: false,
	};

	const event = new window.KeyboardEvent( 'keydown', {
		keyCode,
		shiftKey,
	} );
	event.stopImmediatePropagation = () => {
		interaction.stopped = true;
	};
	container.getDOMNode().dispatchEvent( event );

	return interaction;
}

describe( 'NavigableMenu', () => {
	it( 'vertical: should navigate by up and down', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<NavigableMenu orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span id="btn-deep-wrapper">
					<span id="btn-deep" tabIndex="-1">Deep</span>
				</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu>
			/* eslint-enable no-restricted-syntax */
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedStop ) {
			const interaction = fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( DOWN, 1, true );
		assertKeyDown( DOWN, 2, true );
		assertKeyDown( DOWN, 3, true );
		assertKeyDown( DOWN, 0, true );
		assertKeyDown( UP, 3, true );
		assertKeyDown( UP, 2, true );
		assertKeyDown( UP, 1, true );
		assertKeyDown( UP, 0, true );
		assertKeyDown( LEFT, 0, false );
		assertKeyDown( RIGHT, 0, false );
		assertKeyDown( SPACE, 0, false );
	} );

	it( 'vertical: should navigate by up and down, and stop at edges', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<NavigableMenu cycle={ false } orientation="vertical" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu>
			/* eslint-enable no-restricted-syntax */
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedStop ) {
			const interaction = fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( DOWN, 1, true );
		assertKeyDown( DOWN, 2, true );
		assertKeyDown( DOWN, 2, true );
		assertKeyDown( UP, 1, true );
		assertKeyDown( UP, 0, true );
		assertKeyDown( UP, 0, true );
		assertKeyDown( LEFT, 0, false );
		assertKeyDown( RIGHT, 0, false );
		assertKeyDown( SPACE, 0, false );
	} );

	it( 'horizontal: should navigate by left and right', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<NavigableMenu orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span id="btn-deep-wrapper">
					<span id="btn-deep" tabIndex="-1">Deep</span>
				</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu>
			/* eslint-enable no-restricted-syntax */
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedStop ) {
			const interaction = fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( RIGHT, 1, true );
		assertKeyDown( RIGHT, 2, true );
		assertKeyDown( RIGHT, 3, true );
		assertKeyDown( RIGHT, 0, true );
		assertKeyDown( LEFT, 3, true );
		assertKeyDown( LEFT, 2, true );
		assertKeyDown( LEFT, 1, true );
		assertKeyDown( LEFT, 0, true );
		assertKeyDown( UP, 0, false );
		assertKeyDown( DOWN, 0, false );
		assertKeyDown( SPACE, 0, false );
	} );

	it( 'horizontal: should navigate by left and right, and stop at edges', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<NavigableMenu cycle={ false } orientation="horizontal" onNavigate={ ( index ) => currentIndex = index }>
				<span tabIndex="-1" id="btn1">One</span>
				<span tabIndex="-1" id="btn2">Two</span>
				<span tabIndex="-1" id="btn3">Three</span>
			</NavigableMenu>
			/* eslint-enable no-restricted-syntax */
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedStop ) {
			const interaction = fireKeyDown( container, keyCode, false );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( RIGHT, 1, true );
		assertKeyDown( RIGHT, 2, true );
		assertKeyDown( RIGHT, 2, true );
		assertKeyDown( LEFT, 1, true );
		assertKeyDown( LEFT, 0, true );
		assertKeyDown( LEFT, 0, true );
		assertKeyDown( DOWN, 0, false );
		assertKeyDown( UP, 0, false );
		assertKeyDown( SPACE, 0, false );
	} );

	it( 'both: should navigate by up/down and left/right', () => {
		let currentIndex = 0;
		const wrapper = mount( (
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<NavigableMenu orientation="both" onNavigate={ ( index ) => currentIndex = index }>
				<button id="btn1">One</button>
				<button id="btn2">Two</button>
				<button id="btn3">Three</button>
			</NavigableMenu>
			/* eslint-enable no-restricted-syntax */
		) );

		simulateVisible( wrapper, '*' );

		const container = wrapper.find( 'div' );
		wrapper.getDOMNode().querySelector( '#btn1' ).focus();

		// Navigate options
		function assertKeyDown( keyCode, expectedActiveIndex, expectedStop ) {
			const interaction = fireKeyDown( container, keyCode );
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( DOWN, 1, true );
		assertKeyDown( DOWN, 2, true );
		assertKeyDown( DOWN, 0, true );
		assertKeyDown( RIGHT, 1, true );
		assertKeyDown( RIGHT, 2, true );
		assertKeyDown( RIGHT, 0, true );
		assertKeyDown( UP, 2, true );
		assertKeyDown( UP, 1, true );
		assertKeyDown( UP, 0, true );
		assertKeyDown( LEFT, 2, true );
		assertKeyDown( LEFT, 1, true );
		assertKeyDown( LEFT, 0, true );
		assertKeyDown( SPACE, 0, false );
	} );
} );
