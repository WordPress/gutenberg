/**
 * Internal dependencies
 */
import {
	getCandidateDocuments,
	isEventTargetSelectedRichText,
} from '../keyboard-target';

/*
 * jsdom does not implement `Element.isContentEditable`, so mark elements
 * explicitly the way the browser would for a contentEditable subtree.
 */
function markContentEditable( element ) {
	Object.defineProperty( element, 'isContentEditable', {
		value: true,
		configurable: true,
	} );
}

/**
 * Build a canvas-like DOM: a block wrapper carrying `data-block` with a
 * rich-text editable inside, appended to the test document body.
 *
 * @param {Object} options
 * @param {string} options.clientId       Block client id.
 * @param {string} [options.attributeKey] `data-wp-block-attribute-key` value.
 * @return {{ block: HTMLElement, editable: HTMLElement }} Elements.
 */
function createBlockEditable( { clientId, attributeKey } ) {
	const block = document.createElement( 'div' );
	block.setAttribute( 'data-block', clientId );
	const editable = document.createElement( 'p' );
	editable.className = 'block-editor-rich-text__editable';
	if ( attributeKey ) {
		editable.setAttribute( 'data-wp-block-attribute-key', attributeKey );
	}
	markContentEditable( editable );
	block.appendChild( editable );
	document.body.appendChild( block );
	return { block, editable };
}

describe( 'isEventTargetSelectedRichText', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	const selection = { clientId: 'block-1', attributeKey: 'content' };

	it( 'accepts input targeting the selected block’s rich text', () => {
		const { editable } = createBlockEditable( {
			clientId: 'block-1',
			attributeKey: 'content',
		} );
		expect(
			isEventTargetSelectedRichText( { target: editable }, selection )
		).toBe( true );
	} );

	it( 'accepts a descendant of the editable (formatted run)', () => {
		const { editable } = createBlockEditable( {
			clientId: 'block-1',
			attributeKey: 'content',
		} );
		const strong = document.createElement( 'strong' );
		markContentEditable( strong );
		editable.appendChild( strong );
		expect(
			isEventTargetSelectedRichText( { target: strong }, selection )
		).toBe( true );
	} );

	it( 'accepts an editable that does not expose an attribute key', () => {
		const { editable } = createBlockEditable( { clientId: 'block-1' } );
		expect(
			isEventTargetSelectedRichText( { target: editable }, selection )
		).toBe( true );
	} );

	it( 'rejects a sidebar note composer (no block wrapper)', () => {
		// The collab-sidebar composer is contentEditable but lives outside
		// any `[data-block]` wrapper — typing there must never be
		// intercepted even while a canvas block is still selected.
		const composer = document.createElement( 'div' );
		composer.className = 'wp-rich-text-control';
		markContentEditable( composer );
		document.body.appendChild( composer );
		expect(
			isEventTargetSelectedRichText( { target: composer }, selection )
		).toBe( false );
	} );

	it( 'rejects a rich text belonging to a different block', () => {
		const { editable } = createBlockEditable( {
			clientId: 'block-2',
			attributeKey: 'content',
		} );
		expect(
			isEventTargetSelectedRichText( { target: editable }, selection )
		).toBe( false );
	} );

	it( 'rejects a different attribute of the selected block', () => {
		const { editable } = createBlockEditable( {
			clientId: 'block-1',
			attributeKey: 'citation',
		} );
		expect(
			isEventTargetSelectedRichText( { target: editable }, selection )
		).toBe( false );
	} );

	it( 'rejects a contentEditable inside the block that is not a rich text', () => {
		const block = document.createElement( 'div' );
		block.setAttribute( 'data-block', 'block-1' );
		const other = document.createElement( 'div' );
		markContentEditable( other );
		block.appendChild( other );
		document.body.appendChild( block );
		expect(
			isEventTargetSelectedRichText( { target: other }, selection )
		).toBe( false );
	} );

	it( 'rejects a non-contentEditable target', () => {
		const { editable } = createBlockEditable( {
			clientId: 'block-1',
			attributeKey: 'content',
		} );
		Object.defineProperty( editable, 'isContentEditable', {
			value: false,
			configurable: true,
		} );
		expect(
			isEventTargetSelectedRichText( { target: editable }, selection )
		).toBe( false );
	} );

	it( 'rejects when there is no block selection', () => {
		const { editable } = createBlockEditable( {
			clientId: 'block-1',
			attributeKey: 'content',
		} );
		expect(
			isEventTargetSelectedRichText( { target: editable }, undefined )
		).toBe( false );
		expect(
			isEventTargetSelectedRichText( { target: editable }, {} )
		).toBe( false );
	} );

	it( 'rejects a missing target', () => {
		expect( isEventTargetSelectedRichText( {}, selection ) ).toBe( false );
		expect( isEventTargetSelectedRichText( undefined, selection ) ).toBe(
			false
		);
	} );
} );

describe( 'getCandidateDocuments', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'always includes the top document', () => {
		expect( getCandidateDocuments() ).toContain( document );
	} );

	it( 'includes same-origin iframe documents once', () => {
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		const docs = getCandidateDocuments();
		expect( docs ).toContain( iframe.contentDocument );
		expect( docs ).toHaveLength( 2 );
	} );
} );
