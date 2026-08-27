import { render, screen } from '@testing-library/react';
import {
	RevisionsCodeDiff,
	getCodeDiffDisplayState,
	getCodeDiffRows,
} from '../revisions-code-diff';

function renderCodeDiff( {
	currentContent = '',
	previousContent = '',
	previousRevision,
	showDiff = true,
	isPreviousRevisionLoading = false,
} = {} ) {
	const resolvedPreviousRevision =
		previousRevision === undefined
			? { content: { raw: previousContent } }
			: previousRevision;

	return render(
		<RevisionsCodeDiff
			revision={ { content: { raw: currentContent } } }
			previousRevision={ resolvedPreviousRevision }
			showDiff={ showDiff }
			isPreviousRevisionLoading={ isPreviousRevisionLoading }
		/>
	);
}

describe( 'getCodeDiffRows', () => {
	it( 'adds line numbers for both revisions', () => {
		expect(
			getCodeDiffRows(
				'First\nBefore\nLast\n',
				'First\nAfter\nLast\n',
				true
			)
		).toEqual( [
			{
				value: 'First',
				status: 'unchanged',
				previousLineNumber: 1,
				currentLineNumber: 1,
			},
			{
				value: 'Before',
				status: 'removed',
				previousLineNumber: 2,
				currentLineNumber: null,
			},
			{
				value: 'After',
				status: 'added',
				previousLineNumber: null,
				currentLineNumber: 2,
			},
			{
				value: 'Last',
				status: 'unchanged',
				previousLineNumber: 3,
				currentLineNumber: 3,
			},
		] );
	} );

	it( 'returns the selected revision without diff markers when changes are hidden', () => {
		expect( getCodeDiffRows( 'Old', 'First\n\nLast', false ) ).toEqual( [
			{
				value: 'First',
				status: 'unchanged',
				previousLineNumber: null,
				currentLineNumber: 1,
			},
			{
				value: '',
				status: 'unchanged',
				previousLineNumber: null,
				currentLineNumber: 2,
			},
			{
				value: 'Last',
				status: 'unchanged',
				previousLineNumber: null,
				currentLineNumber: 3,
			},
		] );
	} );

	it( 'uses a coarse diff when line diffing exceeds its limits', () => {
		const previousLines = Array.from(
			{ length: 501 },
			( _, index ) => `Before ${ index }`
		);
		const currentLines = Array.from(
			{ length: 501 },
			( _, index ) => `After ${ index }`
		);
		const rows = getCodeDiffRows(
			previousLines.join( '\n' ),
			currentLines.join( '\n' ),
			true
		);

		expect( rows ).toHaveLength( 1002 );
		expect( rows[ 0 ] ).toEqual( {
			value: 'Before 0',
			status: 'removed',
			previousLineNumber: 1,
			currentLineNumber: null,
		} );
		expect( rows[ 500 ] ).toEqual( {
			value: 'Before 500',
			status: 'removed',
			previousLineNumber: 501,
			currentLineNumber: null,
		} );
		expect( rows[ 501 ] ).toEqual( {
			value: 'After 0',
			status: 'added',
			previousLineNumber: null,
			currentLineNumber: 1,
		} );
		expect( rows[ 1001 ] ).toEqual( {
			value: 'After 500',
			status: 'added',
			previousLineNumber: null,
			currentLineNumber: 501,
		} );
	} );

	it( 'adds word-level segments to similar changed lines', () => {
		const rows = getCodeDiffRows(
			'<p>Hello world</p>\n',
			'<p>Hello there</p>\n',
			true
		);

		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ].segments ).toEqual( [
			{ value: '<p>Hello ' },
			{ value: 'world', removed: true },
			{ value: '</p>' },
		] );
		expect( rows[ 1 ].segments ).toEqual( [
			{ value: '<p>Hello ' },
			{ value: 'there', added: true },
			{ value: '</p>' },
		] );
		// Each side's segments reconstruct the full line.
		for ( const row of rows ) {
			expect(
				row.segments.map( ( segment ) => segment.value ).join( '' )
			).toBe( row.value );
		}
	} );

	it( 'keeps line-level highlighting for dissimilar lines', () => {
		const rows = getCodeDiffRows( 'abcdefgh\n', 'stuvwxyz\n', true );

		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ] ).not.toHaveProperty( 'segments' );
		expect( rows[ 1 ] ).not.toHaveProperty( 'segments' );
	} );

	it( 'pairs changed lines by similarity rather than position', () => {
		const rows = getCodeDiffRows(
			'<p>The quick brown fox</p>\n<p>Completely unrelated words</p>\n',
			'<p>Some other sentence entirely</p>\n<p>The quick brown foxes</p>\n',
			true
		);

		expect( rows ).toHaveLength( 4 );
		// The first removed line matches the second added line.
		expect( rows[ 0 ].segments ).toEqual( [
			{ value: '<p>The quick brown ' },
			{ value: 'fox', removed: true },
			{ value: '</p>' },
		] );
		expect( rows[ 3 ].segments ).toEqual( [
			{ value: '<p>The quick brown ' },
			{ value: 'foxes', added: true },
			{ value: '</p>' },
		] );
		// The remaining lines are too different for word highlights.
		expect( rows[ 1 ] ).not.toHaveProperty( 'segments' );
		expect( rows[ 2 ] ).not.toHaveProperty( 'segments' );
	} );

	it( 'skips word-level pairing when a changed block is too large', () => {
		const previousLines = Array.from(
			{ length: 51 },
			( _, index ) => `Before line ${ index }`
		);
		const currentLines = Array.from(
			{ length: 51 },
			( _, index ) => `After line ${ index }`
		);
		const rows = getCodeDiffRows(
			`Start\n${ previousLines.join( '\n' ) }\nEnd\n`,
			`Start\n${ currentLines.join( '\n' ) }\nEnd\n`,
			true
		);

		expect( rows ).toHaveLength( 104 );
		expect( rows.every( ( row ) => ! ( 'segments' in row ) ) ).toBe( true );
	} );

	it( 'shares one time budget across word-level diffs', () => {
		// These unrelated lines force word diffing to time out. All word diffs
		// share one budget.
		const makeContent = ( seed ) =>
			Array.from( { length: 50 }, ( _, line ) =>
				[ ...Array( 1000 ).keys() ]
					.map( ( token ) => `w${ seed }${ line }_${ token }` )
					.join( ' ' )
			).join( '\n' );
		const previousContent = `Start\n${ makeContent( 'a' ) }\nEnd\n`;
		const currentContent = `Start\n${ makeContent( 'b' ) }\nEnd\n`;

		const start = Date.now();
		const rows = getCodeDiffRows( previousContent, currentContent, true );
		const elapsed = Date.now() - start;

		expect( rows ).toHaveLength( 102 );
		expect( rows.every( ( row ) => ! ( 'segments' in row ) ) ).toBe( true );
		expect( elapsed ).toBeLessThan( 1000 );
	} );

	it( 'skips blank lines when pairing changed blocks', () => {
		const rows = getCodeDiffRows(
			'Start\nAlpha beta gamma\n\nDelta epsilon zeta\nEnd\n',
			'Start\nAlpha beta gamma changed\nDelta epsilon zeta changed\nEnd\n',
			true
		);

		const blankRow = rows.find( ( row ) => row.value === '' );
		expect( blankRow.status ).toBe( 'removed' );
		expect( blankRow ).not.toHaveProperty( 'segments' );
		// The non-blank lines around it still pair up.
		expect( rows[ 1 ] ).toHaveProperty( 'segments' );
		expect( rows[ 3 ] ).toHaveProperty( 'segments' );
		expect( rows[ 4 ] ).toHaveProperty( 'segments' );
		expect( rows[ 5 ] ).toHaveProperty( 'segments' );
	} );
} );

describe( 'getCodeDiffDisplayState', () => {
	it( 'waits for an older revision from the next page', () => {
		expect(
			getCodeDiffDisplayState( {
				previousRevision: null,
				showDiff: true,
				hasOlderRevisionPage: true,
				hasFinishedPreviousRevision: false,
			} )
		).toEqual( {
			showDiff: true,
			isPreviousRevisionLoading: true,
		} );
	} );

	it( 'shows the selected revision without a diff when the older revision request finishes without data', () => {
		expect(
			getCodeDiffDisplayState( {
				previousRevision: null,
				showDiff: true,
				hasOlderRevisionPage: true,
				hasFinishedPreviousRevision: true,
			} )
		).toEqual( {
			showDiff: false,
			isPreviousRevisionLoading: false,
		} );
	} );

	it( 'compares the oldest revision against empty content', () => {
		expect(
			getCodeDiffDisplayState( {
				previousRevision: null,
				showDiff: true,
				hasOlderRevisionPage: false,
				hasFinishedPreviousRevision: true,
			} )
		).toEqual( {
			showDiff: true,
			isPreviousRevisionLoading: false,
		} );
	} );
} );

describe( 'RevisionsCodeDiff', () => {
	it( 'shows added and removed markup in the code diff', () => {
		renderCodeDiff( {
			previousContent: '<!-- wp:paragraph -->\n<p>Before</p>',
			currentContent: '<!-- wp:paragraph -->\n<p>After</p>',
		} );

		expect(
			screen.getByRole( 'region', { name: 'Code changes' } )
		).toBeVisible();
		// jsdom inserts spaces between accessible names from adjacent inline
		// nodes; browsers do not.
		expect(
			screen.getByRole( 'row', { name: /Removed.*<p>\s*Before\s*<\/p>/ } )
		).toHaveClass( 'is-removed' );
		expect(
			screen.getByRole( 'row', { name: /Added.*<p>\s*After\s*<\/p>/ } )
		).toHaveClass( 'is-added' );
	} );

	it( 'shows only the selected revision when changes are hidden', () => {
		renderCodeDiff( {
			previousContent: '<p>Before</p>',
			currentContent: '<p>After</p>',
			showDiff: false,
		} );

		expect(
			screen.getByRole( 'region', { name: 'Revision code' } )
		).toHaveTextContent( '<p>After</p>' );
		expect( screen.queryByText( '<p>Before</p>' ) ).not.toBeInTheDocument();
	} );

	it( 'waits while the previous revision is loading', () => {
		renderCodeDiff( {
			currentContent: '<p>Current</p>',
			previousRevision: null,
			isPreviousRevisionLoading: true,
		} );

		expect( screen.getByRole( 'presentation' ) ).toHaveClass(
			'components-spinner'
		);
		expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
	} );

	it( 'compares the oldest revision against empty content', () => {
		renderCodeDiff( {
			currentContent: '<p>Oldest</p>',
			previousRevision: null,
		} );

		expect(
			screen.getByRole( 'row', { name: /Added.*<p>Oldest<\/p>/ } )
		).toHaveClass( 'is-added' );
	} );

	it( 'highlights changed words without announcing them separately', () => {
		renderCodeDiff( {
			previousContent: '<!-- wp:paragraph -->\n<p>Hello world</p>',
			currentContent: '<!-- wp:paragraph -->\n<p>Hello there</p>',
		} );

		expect(
			screen.getByText( 'world', {
				selector: '.editor-revisions-code-diff__segment.is-removed',
			} )
		).toBeVisible();
		expect(
			screen.getByText( 'there', {
				selector: '.editor-revisions-code-diff__segment.is-added',
			} )
		).toBeVisible();
		// The row announces the change once. Highlight spans do not add
		// insertion or deletion roles.
		expect(
			screen.getByRole( 'row', {
				name: /Removed.*<p>Hello\s+world\s*<\/p>/,
			} )
		).toHaveClass( 'is-removed' );
		expect( screen.queryAllByRole( 'deletion' ) ).toHaveLength( 0 );
		expect( screen.queryAllByRole( 'insertion' ) ).toHaveLength( 0 );
	} );

	it( 'preserves blank source lines without inserting text', () => {
		renderCodeDiff( {
			currentContent: 'First\n\nLast',
			showDiff: false,
		} );

		expect(
			screen.getByText( '', {
				selector: '.editor-revisions-code-diff__code code',
				normalizer: ( content ) => content,
			} )
		).toBeEmptyDOMElement();
	} );
} );
