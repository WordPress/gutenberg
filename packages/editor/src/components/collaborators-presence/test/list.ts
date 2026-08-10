import { revealTargetForNavigation } from '../list';

describe( 'revealTargetForNavigation', () => {
	// jsdom only tracks activeElement/focus for elements attached to the
	// live test document (global `document`) — a detached document built
	// via document.implementation.createHTMLDocument() never reflects
	// .focus() calls, so these tests attach to and clean up after the
	// global document rather than a synthetic one.
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'blurs whatever the editor document currently has focused', () => {
		const input = document.createElement( 'div' );
		input.setAttribute( 'contenteditable', 'true' );
		input.setAttribute( 'tabindex', '0' );
		document.body.appendChild( input );
		input.focus();
		expect( input ).toHaveFocus();

		revealTargetForNavigation(
			document.createElement( 'div' ),
			input.ownerDocument
		);

		expect( input ).not.toHaveFocus();
	} );

	it( 'does nothing when nothing is focused', () => {
		// Should not throw.
		expect( () =>
			revealTargetForNavigation(
				document.createElement( 'div' ),
				document
			)
		).not.toThrow();
	} );

	it( 'does nothing when editorDocument is null', () => {
		expect( () =>
			revealTargetForNavigation( document.createElement( 'div' ), null )
		).not.toThrow();
	} );

	it( 'opens a closed native <details> target directly', () => {
		const details = document.createElement( 'details' );
		expect( details.open ).toBe( false );

		revealTargetForNavigation( details, null );

		expect( details.open ).toBe( true );
	} );

	it( 'leaves an already-open <details> target open', () => {
		const details = document.createElement( 'details' );
		details.open = true;

		revealTargetForNavigation( details, null );

		expect( details.open ).toBe( true );
	} );

	it( 'does not attempt to open a non-<details> target', () => {
		// core/accordion-item-style target: a plain element whose
		// visibility is driven by something other than a native `open`
		// property. There's nothing for this function to set — it should
		// simply do nothing besides the blur step.
		const element = document.createElement( 'div' );

		expect( () =>
			revealTargetForNavigation( element, null )
		).not.toThrow();
	} );
} );
