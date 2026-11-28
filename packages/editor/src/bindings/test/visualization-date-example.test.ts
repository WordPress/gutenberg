import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

interface SourceRequest {
	select: ( store: unknown ) => {
		getEditedEntityRecord: (
			kind: string,
			postType: string,
			postId: number
		) => { meta: { wp_movies_visualization_date?: string | null } };
	};
	context: { postType: string; postId: number };
	isForCopy?: boolean;
}

interface DocumentedSource {
	supportsCopy?: boolean;
	getValues: ( request: SourceRequest ) => { content?: string };
}

const documentation = readFileSync(
	new URL(
		'../../../../../docs/reference-guides/block-api/block-bindings.md',
		import.meta.url
	),
	'utf8'
).replace( /\r\n/g, '\n' );
const example = Array.from( documentation.matchAll( /```js\n([\s\S]*?)```/g ) )
	.map( ( match ) => match[ 1 ] )
	.find( ( code ) => code.includes( "name: 'wpmovies/visualization-date'" ) );

function getSource() {
	if ( ! example ) {
		throw new Error(
			'The documented source registration example is missing.'
		);
	}
	let source: DocumentedSource | undefined;
	runInNewContext(
		example.replace( /^import .*;\n/gm, '' ),
		{
			registerBlockBindingsSource: ( value: DocumentedSource ) => {
				source = value;
			},
			__: ( text: string ) => text,
			coreDataStore: {},
			Date: class extends Date {
				toLocaleDateString() {
					return 'Today placeholder';
				}
			},
		},
		{ timeout: 1000 }
	);
	if ( ! source ) {
		throw new Error( 'The documented source was not registered.' );
	}
	return source;
}

describe( 'the documented visualization-date source', () => {
	it( 'opts in to copy resolution and keeps its display fallback out of the clipboard', () => {
		const source = getSource();
		const request = {
			select: () => ( { getEditedEntityRecord: () => ( { meta: {} } ) } ),
			context: { postType: 'post', postId: 41 },
		};
		expect( source.getValues( request ).content ).toBe(
			'Today placeholder'
		);
		expect(
			source.getValues( { ...request, isForCopy: true } )
		).not.toHaveProperty( 'content' );
		expect( source.supportsCopy ).toBe( true );
	} );

	it( 'preserves a genuine stored date for display and copy', () => {
		const source = getSource();
		const request = {
			select: () => ( {
				getEditedEntityRecord: () => ( {
					meta: { wp_movies_visualization_date: '2026-11-23' },
				} ),
			} ),
			context: { postType: 'post', postId: 41 },
		};
		expect( source.getValues( request ).content ).toBe( '2026-11-23' );
		expect(
			source.getValues( { ...request, isForCopy: true } ).content
		).toBe( '2026-11-23' );
	} );

	const fallbackCases: {
		label: string;
		storedValue: string | null;
		expectedCopy: { content?: string };
	}[] = [
		{
			label: 'an empty string',
			storedValue: '',
			expectedCopy: { content: '' },
		},
		{ label: 'null', storedValue: null, expectedCopy: {} },
	];
	it.each( fallbackCases )(
		'keeps the display fallback separate from the copied value for $label',
		( { storedValue, expectedCopy } ) => {
			const source = getSource();
			const request = {
				select: () => ( {
					getEditedEntityRecord: () => ( {
						meta: { wp_movies_visualization_date: storedValue },
					} ),
				} ),
				context: { postType: 'post', postId: 41 },
			};
			expect( source.getValues( request ).content ).toBe(
				'Today placeholder'
			);
			const copied = source.getValues( { ...request, isForCopy: true } );
			expect( { ...copied } ).toStrictEqual( expectedCopy );
		}
	);
} );
