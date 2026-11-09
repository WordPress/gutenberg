import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../style.scss';

describe( 'Save panel positioning', () => {
	let container: HTMLDivElement, panel: HTMLDivElement;

	beforeEach( () => {
		container = document.createElement( 'div' );
		container.style.setProperty( '--wp-admin--admin-bar--height', '32px' );
		panel = document.createElement( 'div' );
		panel.className = 'edit-site-layout__actions';
		const button = document.createElement( 'button' );
		button.textContent = 'Open save panel';
		panel.append( button );
		container.append( panel );
		document.body.append( container );
	} );

	afterEach( () => {
		container.remove();
	} );

	it.each( [ '0px', '32px', '46px' ] )(
		'keeps the open panel visible without focus below a %s admin bar',
		( adminBarHeight ) => {
			container.style.setProperty(
				'--wp-admin--admin-bar--height',
				adminBarHeight
			);
			panel.classList.add( 'is-entity-save-view-open' );

			expect( panel.matches( ':focus-within' ) ).toBe( false );
			const { top, bottom } = panel.getBoundingClientRect();
			expect( top ).toBe( parseInt( adminBarHeight, 10 ) );
			expect( bottom ).toBe( window.innerHeight );
		}
	);

	it( 'keeps the closed launcher offscreen until it receives keyboard focus', async () => {
		expect( panel.getBoundingClientRect().bottom ).toBeLessThan( 0 );

		await userEvent.tab();

		expect( panel.matches( ':focus-within' ) ).toBe( true );
		const { top, bottom } = panel.getBoundingClientRect();
		expect( top ).toBeGreaterThan( 32 );
		expect( bottom ).toBe( window.innerHeight );
	} );
} );
