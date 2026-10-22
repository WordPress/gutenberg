/**
 * Distinct marker kinds: one rich-text format per suggestion kind, so markers
 * of different kinds stack over the same characters without re-attributing
 * each other (#73411, overlapping suggestions).
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	applyFormat,
	create,
	registerFormatType,
	toHTMLString,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	SUGGESTION_A11Y_FORMAT_NAME,
	SUGGESTION_CLASSES,
	SUGGESTION_FORMAT_NAMES,
	SUGGESTION_MARKER_KINDS,
	addSuggestionRoleFormats,
	canonicalizeSuggestionStack,
	isSuggestionFormat,
	registerSuggestionFormat,
	suggestionFormatNameFor,
	suggestionKindOf,
	suggestionMarkersAt,
	unregisterSuggestionFormats,
} from '../format';
import {
	buildSuggestionMarkerAttributes,
	insertInlineAddition,
} from '../operations';
import { hasSuggestionMarkers, stripSuggestionMarkers } from '../strip-markers';
import { applyFormatPlan, planFormatMarkers } from '../reconcile-format';
import { applyEditPlan } from '../reconcile-edit';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

const BOLD = 'test/kinds-bold';

/*
 * Rich text serializes the registered attributes first and the class last, so
 * the fixtures do too and compare byte for byte.
 */
const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = 1
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

describe( 'suggestion marker kinds', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		if ( ! getFormatType( BOLD ) ) {
			registerFormatType( BOLD, {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} as any );
		}
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		if ( getFormatType( BOLD ) ) {
			unregisterFormatType( BOLD );
		}
	} );

	it( 'registers one format per kind, each with its own class token', () => {
		expect( SUGGESTION_FORMAT_NAMES ).toEqual( [
			'core/suggestion-add',
			'core/suggestion-del',
			'core/suggestion-format',
		] );
		expect( SUGGESTION_CLASSES ).toEqual( [
			'wp-suggestion-add',
			'wp-suggestion-del',
			'wp-suggestion-format',
		] );
		for ( const [ kind, { formatName, className } ] of Object.entries(
			SUGGESTION_MARKER_KINDS
		) ) {
			const format = getFormatType( formatName );
			expect( format?.tagName ).toBe( 'mark' );
			expect( format?.className ).toBe( className );
			expect( suggestionFormatNameFor( kind as any ) ).toBe( formatName );
		}
		expect( getFormatType( 'core/suggestion' ) ).toBeUndefined();
		expect( getFormatType( SUGGESTION_A11Y_FORMAT_NAME ) ).toBeTruthy();
	} );

	it( 'parses each marker kind into its own format and round-trips it', () => {
		const html = `a${ mark( 'add', 1, 'b' ) }${ mark(
			'del',
			2,
			'c'
		) }${ mark( 'format', 3, 'd' ) }e`;
		const value = RichTextData.fromHTMLString( html );
		const kinds = ( value.formats as any[] ).map( ( stack ) =>
			stack?.map( ( f: any ) => suggestionKindOf( f ) )
		);
		expect( kinds ).toEqual( [
			undefined,
			[ 'add' ],
			[ 'del' ],
			[ 'format' ],
			undefined,
		] );
		expect( value.toHTMLString() ).toBe( html );
	} );

	it( 'does not take the old single class or a lookalike for a marker', () => {
		for ( const html of [
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add">x</mark>',
			'<mark class="wp-suggestion-foo" data-suggestion-id="1">x</mark>',
		] ) {
			const { formats } = create( { html } );
			expect(
				( formats[ 0 ] ?? [] ).some( ( f: any ) =>
					isSuggestionFormat( f )
				)
			).toBe( false );
		}
	} );

	it( 'keeps markers of different kinds on the same characters', () => {
		// Applying a del inside an add used to replace the add marker there.
		const add = create( { html: `x${ mark( 'add', 1, 'abcd' ) }y` } );
		const withDel = applyFormat(
			add,
			{
				type: suggestionFormatNameFor( 'del' ),
				attributes: buildSuggestionMarkerAttributes( {
					id: 2,
					type: 'del',
					authorId: 2,
				} ),
			} as any,
			2,
			4
		);
		const markers = suggestionMarkersAt( withDel.formats[ 2 ] );
		expect( markers.add?.attributes[ 'data-suggestion-id' ] ).toBe( '1' );
		expect( markers.del?.attributes[ 'data-suggestion-id' ] ).toBe( '2' );
		expect( markers.format ).toBeUndefined();
	} );

	describe( 'canonical stack order', () => {
		const writes = [
			{ kind: 'add', id: 1, start: 0, end: 8 },
			{ kind: 'format', id: 2, start: 2, end: 6 },
			{ kind: 'del', id: 3, start: 4, end: 8 },
			{ kind: 'bold', start: 3, end: 5 },
		] as const;

		const apply = ( order: number[] ) => {
			let record: any = create( { text: 'abcdefgh' } );
			for ( const index of order ) {
				const write = writes[ index ];
				const format =
					write.kind === 'bold'
						? { type: BOLD }
						: {
								type: suggestionFormatNameFor( write.kind ),
								attributes: buildSuggestionMarkerAttributes( {
									id: write.id,
									type: write.kind,
									authorId: 1,
								} ),
							};
				record = canonicalizeSuggestionStack(
					applyFormat( record, format as any, write.start, write.end )
				);
			}
			return toHTMLString( { value: record } );
		};

		const permutations = ( items: number[] ): number[][] =>
			items.length <= 1
				? [ items ]
				: items.flatMap( ( item, index ) =>
						permutations( [
							...items.slice( 0, index ),
							...items.slice( index + 1 ),
						] ).map( ( rest ) => [ item, ...rest ] )
					);

		it( 'serializes the same regardless of write order', () => {
			const results = new Set(
				permutations( [ 0, 1, 2, 3 ] ).map( apply )
			);
			expect( results.size ).toBe( 1 );
		} );

		it( 'nests add outermost, then format, then del, then content', () => {
			const { formats } = create( { html: apply( [ 3, 2, 1, 0 ] ) } );
			// Offset 4 carries every marker and the bold.
			expect(
				( formats[ 4 ] as any[] ).map(
					( f ) => suggestionKindOf( f ) ?? f.type
				)
			).toEqual( [ 'add', 'format', 'del', BOLD ] );
		} );

		it( 'never splits a format marker around a nested deletion', () => {
			const html = apply( [ 2, 1, 0, 3 ] );
			expect( html.match( /wp-suggestion-format/g ) ).toHaveLength( 1 );
			expect( html.match( /wp-suggestion-add/g ) ).toHaveLength( 1 );
		} );

		it( 'returns the record unchanged when nothing needs reordering', () => {
			const record = create( { html: `a${ mark( 'add', 1, 'b' ) }` } );
			expect( canonicalizeSuggestionStack( record ) ).toBe( record );
		} );
	} );

	describe( 'writers', () => {
		it( 'writes an addition as a wp-suggestion-add marker', () => {
			const value = insertInlineAddition(
				RichTextData.fromHTMLString( 'ab' ),
				{
					text: 'X',
					attributes: buildSuggestionMarkerAttributes( {
						id: 5,
						type: 'add',
						authorId: 1,
					} ),
					start: 1,
				}
			);
			expect( value.toHTMLString() ).toBe(
				`a${ mark( 'add', 5, 'X' ) }b`
			);
		} );

		it( 'writes a deletion as a wp-suggestion-del marker', () => {
			const value = applyEditPlan(
				RichTextData.fromHTMLString( 'abc' ),
				[ { type: 'wrap-del', start: 1, end: 2, newNote: true } ],
				{ authorId: 1, ids: [ 6 ] }
			);
			expect( value.toHTMLString() ).toBe(
				`a${ mark( 'del', 6, 'b' ) }c`
			);
		} );

		it( 'writes a formatting change as a wp-suggestion-format marker', () => {
			const prev = RichTextData.fromHTMLString( 'abc' );
			const next = RichTextData.fromHTMLString( 'a<strong>b</strong>c' );
			const plan = planFormatMarkers( prev, next, { authorId: 1 } );
			const value = applyFormatPlan( next, plan, { id: 7, authorId: 1 } );
			expect( value.toHTMLString() ).toBe(
				`a${ mark( 'format', 7, '<strong>b</strong>' ) }c`
			);
		} );
	} );

	describe( 'strip markers', () => {
		const html = `a${ mark( 'add', 1, `b${ mark( 'del', 2, 'c' ) }` ) }${ mark(
			'format',
			3,
			'<strong>d</strong>'
		) }e`;

		it( 'detects every kind', () => {
			for ( const kind of [ 'add', 'del', 'format' ] as const ) {
				const marked = `x${ mark( kind, 1, 'y' ) }`;
				expect( hasSuggestionMarkers( marked ) ).toBe( true );
				expect(
					hasSuggestionMarkers(
						RichTextData.fromHTMLString( marked )
					)
				).toBe( true );
			}
			expect( hasSuggestionMarkers( 'plain <strong>x</strong>' ) ).toBe(
				false
			);
		} );

		it( 'unwraps every kind and keeps the text and content formats', () => {
			expect( stripSuggestionMarkers( html ) ).toBe(
				'abc<strong>d</strong>e'
			);
		} );
	} );

	describe( 'screen-reader decoration', () => {
		it( 'decorates each marker in a nested stack, right after it', () => {
			const { formats } = create( {
				html: mark( 'add', 1, `out${ mark( 'del', 2, 'in', 7 ) }`, 4 ),
			} );
			const decorated = addSuggestionRoleFormats( formats );
			const describe4 = ( stack: any[] ) =>
				stack.map( ( f: any ) =>
					f.type === SUGGESTION_A11Y_FORMAT_NAME
						? `a11y:${ f.attributes.suggestionType }`
						: suggestionKindOf( f )
				);
			expect( describe4( decorated[ 0 ] ) ).toEqual( [
				'add',
				'a11y:add',
			] );
			expect( describe4( decorated[ 4 ] ) ).toEqual( [
				'add',
				'a11y:add',
				'del',
				'a11y:del',
			] );
			// One decoration object per marker run, so each renders once.
			expect( decorated[ 0 ][ 1 ] ).toBe( decorated[ 4 ][ 1 ] );
			expect( decorated[ 3 ][ 3 ] ).toBe( decorated[ 4 ][ 3 ] );
		} );

		it( 'renders one decoration element per marker run', () => {
			const { formats, text } = create( {
				html: `a${ mark( 'add', 1, `b${ mark( 'del', 2, 'c' ) }d` ) }e`,
			} );
			const html = toHTMLString( {
				value: {
					text,
					formats: addSuggestionRoleFormats( formats ),
					replacements: [],
				} as any,
			} );
			expect( html.match( /class="wp-suggestion-a11y"/g ) ).toHaveLength(
				2
			);
		} );
	} );
} );

describe( 'marker kind checks', () => {
	/*
	 * A raw comparison against one format name silently ignores the other
	 * kinds (the GC would trash a live note, a keyboard would miss a nested
	 * marker). Every check goes through the kind helpers in `format.ts`.
	 */
	it( 'leaves no raw suggestion format name comparison outside format.ts', () => {
		const root = join( __dirname, '..', '..', '..' );
		const offenders: string[] = [];
		const walk = ( dir: string ) => {
			for ( const entry of readdirSync( dir ) ) {
				const path = join( dir, entry );
				if ( statSync( path ).isDirectory() ) {
					if ( entry !== 'test' && entry !== 'build-types' ) {
						walk( path );
					}
					continue;
				}
				if (
					! /\.(ts|tsx|js|jsx)$/.test( entry ) ||
					path.endsWith( join( 'inline-suggestions', 'format.ts' ) )
				) {
					continue;
				}
				const source = readFileSync( path, 'utf8' );
				if (
					/SUGGESTION_FORMAT_NAME\b/.test( source ) ||
					/['"]core\/suggestion(-add|-del|-format)?['"]/.test(
						source
					)
				) {
					offenders.push( relative( root, path ) );
				}
			}
		};
		walk( root );
		expect( offenders ).toEqual( [] );
	} );
} );
