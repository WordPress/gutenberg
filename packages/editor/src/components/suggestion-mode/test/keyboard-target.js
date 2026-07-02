/**
 * Internal dependencies
 */
import {
	getCandidateDocuments,
	isEventTargetSelectedRichText,
	readEventRange,
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

describe( 'readEventRange', () => {
	afterEach( () => {
		document.body.innerHTML = '';
		jest.restoreAllMocks();
	} );

	/**
	 * Build a rich-text-like editable containing `Hello <mark>world</mark>`
	 * (text "Hello world"), appended to the test document body.
	 *
	 * @return {{ editable: HTMLElement, helloText: Text, worldText: Text }}
	 *         The editable and its two text nodes.
	 */
	function createEditableWithMark() {
		const editable = document.createElement( 'p' );
		editable.className = 'block-editor-rich-text__editable';
		const helloText = document.createTextNode( 'Hello ' );
		const mark = document.createElement( 'mark' );
		const worldText = document.createTextNode( 'world' );
		mark.appendChild( worldText );
		editable.appendChild( helloText );
		editable.appendChild( mark );
		document.body.appendChild( editable );
		return { editable, helloText, worldText };
	}

	/*
	 * A plain object shaped like a `StaticRange` (what `getTargetRanges()`
	 * returns): the helper — via rich-text `create` — only reads the four
	 * container/offset properties, so a live `Range` is not required.
	 */
	function staticRange(
		startContainer,
		startOffset,
		endContainer,
		endOffset
	) {
		return { startContainer, startOffset, endContainer, endOffset };
	}

	it( 'maps a target range spanning text and mark nodes to value offsets', () => {
		const { editable, helloText, worldText } = createEditableWithMark();
		const range = staticRange( helloText, 6, worldText, 5 );
		const event = {
			target: editable,
			getTargetRanges: () => [ range ],
		};
		expect( readEventRange( event ) ).toEqual( { start: 6, end: 11 } );
	} );

	it( 'maps a collapsed target range (caret) inside a mark', () => {
		const { editable, worldText } = createEditableWithMark();
		const range = staticRange( worldText, 5, worldText, 5 );
		const event = {
			target: editable,
			getTargetRanges: () => [ range ],
		};
		expect( readEventRange( event ) ).toEqual( { start: 11, end: 11 } );
	} );

	it( 'resolves the editable from a descendant target', () => {
		const { editable, helloText, worldText } = createEditableWithMark();
		const range = staticRange( helloText, 0, worldText, 5 );
		const event = {
			// Real input events target the focused node's element.
			target: editable.querySelector( 'mark' ),
			getTargetRanges: () => [ range ],
		};
		expect( readEventRange( event ) ).toEqual( { start: 0, end: 11 } );
	} );

	it( 'falls back to the live DOM selection when there are no target ranges', () => {
		const { editable, helloText } = createEditableWithMark();
		const range = staticRange( helloText, 2, helloText, 4 );
		jest.spyOn( window, 'getSelection' ).mockReturnValue( {
			rangeCount: 1,
			getRangeAt: () => range,
		} );
		// A clipboard event: no `getTargetRanges` at all.
		expect( readEventRange( { target: editable } ) ).toEqual( {
			start: 2,
			end: 4,
		} );
		// An input event whose target-range list is empty.
		expect(
			readEventRange( {
				target: editable,
				getTargetRanges: () => [],
			} )
		).toEqual( { start: 2, end: 4 } );
	} );

	it( 'ignores target ranges when preferTargetRanges is false', () => {
		const { editable, helloText, worldText } = createEditableWithMark();
		jest.spyOn( window, 'getSelection' ).mockReturnValue( {
			rangeCount: 1,
			getRangeAt: () => staticRange( worldText, 5, worldText, 5 ),
		} );
		const event = {
			target: editable,
			// A delete's target range is pre-expanded to the removed text;
			// deletion callers need the triggering caret instead.
			getTargetRanges: () => [
				staticRange( helloText, 0, worldText, 5 ),
			],
		};
		expect(
			readEventRange( event, { preferTargetRanges: false } )
		).toEqual( { start: 11, end: 11 } );
	} );

	it( 'returns null when no range is available (store fallback)', () => {
		const { editable } = createEditableWithMark();
		jest.spyOn( window, 'getSelection' ).mockReturnValue( {
			rangeCount: 0,
			getRangeAt: () => null,
		} );
		expect(
			readEventRange( { target: editable, getTargetRanges: () => [] } )
		).toBeNull();
	} );

	it( 'returns null when the target is not inside an editable', () => {
		createEditableWithMark();
		const outside = document.createElement( 'div' );
		document.body.appendChild( outside );
		expect(
			readEventRange( { target: outside, getTargetRanges: () => [] } )
		).toBeNull();
		expect( readEventRange( undefined ) ).toBeNull();
	} );

	it( 'returns null when the range reaches outside the editable', () => {
		const { editable, helloText } = createEditableWithMark();
		const outside = document.createElement( 'p' );
		const outsideText = document.createTextNode( 'elsewhere' );
		outside.appendChild( outsideText );
		document.body.appendChild( outside );
		const event = {
			target: editable,
			getTargetRanges: () => [
				staticRange( helloText, 0, outsideText, 3 ),
			],
		};
		expect( readEventRange( event ) ).toBeNull();
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
