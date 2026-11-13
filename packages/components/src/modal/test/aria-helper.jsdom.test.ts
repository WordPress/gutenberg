import { describe, expect, it } from 'vitest';
import { elementShouldBeHidden, modalize, unmodalize } from '../aria-helper';

describe( 'aria-helper', () => {
	it( 'reveals the owning portal when a new modal opens while the previous modal stays open', () => {
		const firstOwner = document.createElement( 'div' );
		const secondOwner = document.createElement( 'div' );
		const firstModal = document.createElement( 'div' );
		const secondModal = document.createElement( 'div' );
		firstOwner.appendChild( firstModal );
		secondOwner.appendChild( secondModal );
		document.body.append( firstOwner, secondOwner );
		modalize( firstModal );
		modalize( secondModal );
		try {
			expect( secondModal.closest( '[aria-hidden="true"]' ) ).toBeNull();
		} finally {
			unmodalize( secondModal );
			unmodalize( firstModal );
			firstOwner.remove();
			secondOwner.remove();
		}
	} );

	it( 'restores one document while another document still has a modal', () => {
		const firstFrame = document.createElement( 'iframe' );
		const secondFrame = document.createElement( 'iframe' );
		document.body.append( firstFrame, secondFrame );
		const first = firstFrame.contentDocument!;
		const second = secondFrame.contentDocument!;
		const firstBackground = first.createElement( 'main' );
		const secondBackground = second.createElement( 'main' );
		const firstModal = first.createElement( 'div' );
		const secondModal = second.createElement( 'div' );
		first.body.append( firstBackground, firstModal );
		second.body.append( secondBackground, secondModal );
		modalize( firstModal );
		modalize( secondModal );
		unmodalize( firstModal );
		try {
			expect( firstBackground ).not.toHaveAttribute( 'aria-hidden' );
			expect( secondBackground ).toHaveAttribute( 'aria-hidden', 'true' );
		} finally {
			unmodalize( secondModal );
			firstFrame.remove();
			secondFrame.remove();
		}
	} );

	describe( 'elementShouldBeHidden', () => {
		it( 'should return true when a div element without attributes is passed', () => {
			const element = document.createElement( 'div' );

			expect( elementShouldBeHidden( element ) ).toBe( true );
		} );

		it( 'should return false when a script element without attributes is passed', () => {
			const element = document.createElement( 'script' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the aria-hidden attribute with value "true"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'aria-hidden', 'true' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the aria-hidden attribute with value "false"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'aria-hidden', 'false' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the role attribute with value "alert"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'role', 'alert' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the role attribute with value "status"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'role', 'status' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the role attribute with value "log"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'role', 'log' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the role attribute with value "marquee"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'role', 'marquee' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );

		it( 'should return false when an element has the role attribute with value "timer"', () => {
			const element = document.createElement( 'div' );
			element.setAttribute( 'role', 'timer' );

			expect( elementShouldBeHidden( element ) ).toBe( false );
		} );
	} );
} );
