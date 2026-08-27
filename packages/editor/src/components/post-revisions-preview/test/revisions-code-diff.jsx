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
		expect(
			screen.getByRole( 'row', { name: /Removed.*<p>Before<\/p>/ } )
		).toHaveClass( 'is-removed' );
		expect(
			screen.getByRole( 'row', { name: /Added.*<p>After<\/p>/ } )
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
