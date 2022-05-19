/**
 * External dependencies
 */
import { fireEvent, render } from '@testing-library/react';
import { each } from 'lodash';

/**
 * WordPress dependencies
 */
import { TAB, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { TabbableContainer } from '../tabbable';

function simulateVisible( container, selector ) {
	const elements = container.querySelectorAll( selector );
	each( elements, ( elem ) => {
		elem.getClientRects = () => [
			'trick-jsdom-into-having-size-for-element-rect',
		];
	} );
}

function fireKeyDown( node, keyCode, shiftKey ) {
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
	fireEvent( node, event );

	return interaction;
}

describe( 'TabbableContainer', () => {
	it( 'should navigate by keypresses', () => {
		let currentIndex = 0;
		const { container } = render(
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<TabbableContainer
				className="wrapper"
				onNavigate={ ( index ) => ( currentIndex = index ) }
			>
				<div className="section" id="section1" tabIndex="0">
					Section One
				</div>
				<div className="section" id="section2" tabIndex="0">
					Section Two
				</div>
				<div className="deep-section-wrapper">
					<div className="section" id="section-deep" tabIndex="0">
						Section to <strong>not</strong> skip
					</div>
				</div>
				<div className="section" id="section3" tabIndex="0">
					Section Three
				</div>
			</TabbableContainer>
			/* eslint-enable no-restricted-syntax */
		);

		simulateVisible( container, '*' );

		container.querySelector( '#section1' ).focus();

		// Navigate options.
		function assertKeyDown(
			keyCode,
			shiftKey,
			expectedActiveIndex,
			expectedStop
		) {
			const interaction = fireKeyDown(
				container.querySelector( '.wrapper' ),
				keyCode,
				shiftKey
			);
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( TAB, false, 1, true );
		assertKeyDown( TAB, false, 2, true );
		assertKeyDown( TAB, false, 3, true );
		assertKeyDown( TAB, false, 0, true );
		assertKeyDown( TAB, true, 3, true );
		assertKeyDown( TAB, true, 2, true );
		assertKeyDown( TAB, true, 1, true );
		assertKeyDown( TAB, true, 0, true );
		assertKeyDown( SPACE, false, 0, false );
	} );

	it( 'should navigate by keypresses and stop at edges', () => {
		let currentIndex = 0;
		const { container } = render(
			/*
				Disabled because of our rule restricting literal IDs, preferring
				`withInstanceId`. In this case, it's fine to use literal IDs.
			*/
			/* eslint-disable no-restricted-syntax */
			<TabbableContainer
				cycle={ false }
				className="wrapper"
				onNavigate={ ( index ) => ( currentIndex = index ) }
			>
				<div className="section" id="section1" tabIndex="0">
					Section One
				</div>
				<div className="section" id="section2" tabIndex="0">
					Section Two
				</div>
				<div className="section" id="section3" tabIndex="0">
					Section Three
				</div>
			</TabbableContainer>
			/* eslint-enable no-restricted-syntax */
		);

		simulateVisible( container, '*' );

		container.querySelector( '#section1' ).focus();

		// Navigate options.
		function assertKeyDown(
			keyCode,
			shiftKey,
			expectedActiveIndex,
			expectedStop
		) {
			const interaction = fireKeyDown(
				container.querySelector( '.wrapper' ),
				keyCode,
				shiftKey
			);
			expect( currentIndex ).toBe( expectedActiveIndex );
			expect( interaction.stopped ).toBe( expectedStop );
		}

		assertKeyDown( TAB, false, 1, true );
		assertKeyDown( TAB, false, 2, true );
		assertKeyDown( TAB, false, 2, true );
		assertKeyDown( TAB, true, 1, true );
		assertKeyDown( TAB, true, 0, true );
		assertKeyDown( TAB, true, 0, true );
		assertKeyDown( SPACE, false, 0, false );
	} );
} );
