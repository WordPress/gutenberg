/**
 * WordPress dependencies
 */
import {
	RichTextData,
	create,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_A11Y_FORMAT_NAME,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_ADDITION,
	suggestionFormat,
	findSuggestionRange,
	registerSuggestionFormat,
	addSuggestionRoleFormats,
} from '../format';

const isRegistered = () =>
	!! select( richTextStore ).getFormatType( SUGGESTION_FORMAT_NAME );

/**
 * Read the suggestion-type attribute off whichever marker covers `offset`.
 *
 * @param {string} html   Serialized rich-text HTML.
 * @param {number} offset Character offset to inspect.
 * @return {?string} The marker's type attribute, or null.
 */
function typeAt( html, offset ) {
	const { formats } = create( { html } );
	const hit = formats[ offset ]?.find(
		( f ) => f.type === SUGGESTION_FORMAT_NAME
	);
	return hit?.attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ] ?? null;
}

describe( 'suggestion format', () => {
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( SUGGESTION_FORMAT_NAME, suggestionFormat );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'round-trips a deletion marker through rich text', () => {
		const html =
			'keep <mark class="wp-suggestion" data-suggestion-id="5" data-suggestion-type="del" data-author="2">remove me</mark> tail';
		const value = RichTextData.fromHTMLString( html );
		const out = value.toHTMLString();
		expect( out ).toContain( 'data-suggestion-id="5"' );
		expect( out ).toContain( 'data-suggestion-type="del"' );
		expect( out ).toContain( 'data-author="2"' );
	} );

	it( 'resolves a deletion marker range by id', () => {
		const value = RichTextData.fromHTMLString(
			'keep <mark class="wp-suggestion" data-suggestion-id="5" data-suggestion-type="del">remove me</mark> tail'
		);
		expect( findSuggestionRange( value, 5 ) ).toEqual( {
			start: 5,
			end: 14,
		} );
	} );

	it( 'resolves an addition marker range by id', () => {
		const value = RichTextData.fromHTMLString(
			'before <mark class="wp-suggestion" data-suggestion-id="9" data-suggestion-type="add">added</mark>'
		);
		expect( findSuggestionRange( value, 9 ) ).toEqual( {
			start: 7,
			end: 12,
		} );
	} );

	it( 'distinguishes del vs add markers on the same block', () => {
		const html =
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">x</mark>' +
			' mid ' +
			'<mark class="wp-suggestion" data-suggestion-id="2" data-suggestion-type="add">y</mark>';
		expect( typeAt( html, 0 ) ).toBe( SUGGESTION_TYPE_DELETION );
		expect( typeAt( html, 6 ) ).toBe( SUGGESTION_TYPE_ADDITION );
	} );

	it( 'returns null for a missing id', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">x</mark>'
		);
		expect( findSuggestionRange( value, 99 ) ).toBeNull();
	} );

	it( 'ignores a note marker (different class) sharing the block', () => {
		const value = RichTextData.fromHTMLString(
			'<mark class="wp-note" data-id="1">noted</mark>'
		);
		expect( findSuggestionRange( value, 1 ) ).toBeNull();
	} );
} );

describe( 'suggestion a11y role decoration', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		for ( const name of [
			SUGGESTION_FORMAT_NAME,
			SUGGESTION_A11Y_FORMAT_NAME,
		] ) {
			if ( select( richTextStore ).getFormatType( name ) ) {
				unregisterFormatType( name );
			}
		}
	} );

	const marker = ( id, type, text ) =>
		`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="${ type }">${ text }</mark>`;

	it( 'registers the editor-only decoration format', () => {
		const format = select( richTextStore ).getFormatType(
			SUGGESTION_A11Y_FORMAT_NAME
		);
		expect( format ).toBeTruthy();
		// Editor-only: prepared into the editable tree, never parsed back.
		expect( format.__experimentalCreatePrepareEditableTree ).toBeInstanceOf(
			Function
		);
		expect( format.__experimentalCreateOnChangeEditableValue ).toBe(
			undefined
		);
	} );

	describe( 'addSuggestionRoleFormats', () => {
		it( 'adds role="deletion" across a del marker run', () => {
			const { formats } = create( {
				html: `ab${ marker( 1, 'del', 'cd' ) }e`,
			} );
			const decorated = addSuggestionRoleFormats( formats );
			for ( const i of [ 2, 3 ] ) {
				const role = decorated[ i ].find(
					( f ) => f.type === SUGGESTION_A11Y_FORMAT_NAME
				);
				expect( role?.attributes.role ).toBe( 'deletion' );
			}
			// Unmarked characters gain nothing.
			expect( decorated[ 0 ] ).toBe( formats[ 0 ] );
			expect( decorated[ 4 ] ).toBe( formats[ 4 ] );
		} );

		it( 'adds role="insertion" for an add marker', () => {
			const { formats } = create( {
				html: marker( 2, 'add', 'xy' ),
			} );
			const decorated = addSuggestionRoleFormats( formats );
			const role = decorated[ 0 ].find(
				( f ) => f.type === SUGGESTION_A11Y_FORMAT_NAME
			);
			expect( role?.attributes.role ).toBe( 'insertion' );
		} );

		it( 'reuses ONE decoration object per marker run so the run stays one element', () => {
			const { formats } = create( {
				html: marker( 1, 'del', 'abc' ),
			} );
			const decorated = addSuggestionRoleFormats( formats );
			const first = decorated[ 0 ].find(
				( f ) => f.type === SUGGESTION_A11Y_FORMAT_NAME
			);
			for ( const i of [ 1, 2 ] ) {
				expect(
					decorated[ i ].find(
						( f ) => f.type === SUGGESTION_A11Y_FORMAT_NAME
					)
				).toBe( first );
			}
		} );

		it( 'gives adjacent distinct markers distinct decorations', () => {
			const { formats } = create( {
				html: `${ marker( 1, 'del', 'ab' ) }${ marker(
					2,
					'add',
					'cd'
				) }`,
			} );
			const decorated = addSuggestionRoleFormats( formats );
			const delRole = decorated[ 1 ].find(
				( f ) => f.type === SUGGESTION_A11Y_FORMAT_NAME
			);
			const addRole = decorated[ 2 ].find(
				( f ) => f.type === SUGGESTION_A11Y_FORMAT_NAME
			);
			expect( delRole.attributes.role ).toBe( 'deletion' );
			expect( addRole.attributes.role ).toBe( 'insertion' );
			expect( delRole ).not.toBe( addRole );
		} );

		it( 'returns the input untouched when nothing is marked', () => {
			const { formats } = create( { html: 'plain <strong>x</strong>' } );
			expect( addSuggestionRoleFormats( formats ) ).toBe( formats );
			expect( addSuggestionRoleFormats( [] ) ).toEqual( [] );
			expect( addSuggestionRoleFormats( undefined ) ).toBe( undefined );
		} );
	} );

	describe( 'serialization safety', () => {
		it( 'never serializes a role into marker content', () => {
			// Content values are serialized without the editable-tree
			// preparation pass, so the role must not appear.
			const value = RichTextData.fromHTMLString(
				`a${ marker( 1, 'add', 'b' ) }c`
			);
			expect( value.toHTMLString() ).not.toContain( 'role=' );
		} );

		it( 'drops a role element read back from the editable DOM', () => {
			// If the decoration ever leaks into HTML handed back to create()
			// (the editable DOM read path), the editor-only format is ignored
			// on parse and the serialized value stays clean.
			const value = RichTextData.fromHTMLString(
				`a<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add"><span class="wp-suggestion-a11y" role="insertion">b</span></mark>c`
			);
			const html = value.toHTMLString();
			expect( html ).not.toContain( 'role=' );
			expect( html ).not.toContain( 'wp-suggestion-a11y' );
			expect( html ).toContain( 'data-suggestion-id="1"' );
			expect( html ).toContain( 'b' );
		} );
	} );
} );
