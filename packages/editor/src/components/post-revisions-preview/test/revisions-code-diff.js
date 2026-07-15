/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import { diffLines } from 'diff';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import RevisionsCodeDiff, { getCodeDiffRows } from '../revisions-code-diff';

jest.mock( 'diff', () => {
	const actual = jest.requireActual( 'diff' );
	return {
		...actual,
		diffLines: jest.fn( actual.diffLines ),
	};
} );

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( object ) => ( {
		...object,
		registerPrivateActions: jest.fn(),
		registerPrivateSelectors: jest.fn(),
	} ),
} ) );

function mockRevisions( {
	currentContent = '',
	previousContent = '',
	previousRevision,
	showDiff = true,
	revisionPage = 1,
	totalRevisions = 2,
	revisionsPerPage = 100,
} = {} ) {
	const resolvedPreviousRevision =
		previousRevision === undefined
			? { content: { raw: previousContent } }
			: previousRevision;

	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getCurrentRevision: () => ( {
				content: { raw: currentContent },
			} ),
			getPreviousRevision: () => resolvedPreviousRevision,
			getRevisionPage: () => revisionPage,
			getRevisionsPerPage: () => revisionsPerPage,
			getCurrentPostRevisionsCount: () => totalRevisions,
			isShowingRevisionDiff: () => showDiff,
		} ) )
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
		diffLines.mockReturnValueOnce( undefined );

		expect( getCodeDiffRows( 'Before\nOld', 'After\nNew', true ) ).toEqual(
			[
				{
					value: 'Before',
					status: 'removed',
					previousLineNumber: 1,
					currentLineNumber: null,
				},
				{
					value: 'Old',
					status: 'removed',
					previousLineNumber: 2,
					currentLineNumber: null,
				},
				{
					value: 'After',
					status: 'added',
					previousLineNumber: null,
					currentLineNumber: 1,
				},
				{
					value: 'New',
					status: 'added',
					previousLineNumber: null,
					currentLineNumber: 2,
				},
			]
		);
		expect( diffLines ).toHaveBeenLastCalledWith(
			'Before\nOld',
			'After\nNew',
			{
				maxEditLength: 1000,
				timeout: 100,
			}
		);
	} );
} );

describe( 'RevisionsCodeDiff', () => {
	it( 'shows added and removed markup in the code diff', () => {
		mockRevisions( {
			previousContent: '<!-- wp:paragraph -->\n<p>Before</p>',
			currentContent: '<!-- wp:paragraph -->\n<p>After</p>',
		} );

		render( <RevisionsCodeDiff /> );

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
		mockRevisions( {
			previousContent: '<p>Before</p>',
			currentContent: '<p>After</p>',
			showDiff: false,
		} );

		render( <RevisionsCodeDiff /> );

		expect(
			screen.getByRole( 'region', { name: 'Revision code' } )
		).toHaveTextContent( '<p>After</p>' );
		expect( screen.queryByText( '<p>Before</p>' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Added' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Removed' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'columnheader', { name: 'Change' } )
		).not.toBeInTheDocument();
		expect(
			within(
				screen.getByRole( 'row', { name: /<p>After<\/p>/ } )
			).getAllByRole( 'cell' )
		).toHaveLength( 2 );
		expect( screen.queryByText( 'Unchanged' ) ).not.toBeInTheDocument();
	} );

	it( 'waits for the previous revision at a page boundary', () => {
		mockRevisions( {
			currentContent: '<p>Current</p>',
			previousRevision: null,
			revisionPage: 1,
			totalRevisions: 101,
		} );

		render( <RevisionsCodeDiff /> );

		expect( screen.getByRole( 'presentation' ) ).toHaveClass(
			'components-spinner'
		);
		expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
	} );

	it( 'compares the oldest revision against empty content', () => {
		mockRevisions( {
			currentContent: '<p>Oldest</p>',
			previousRevision: null,
			revisionPage: 2,
			totalRevisions: 101,
		} );

		render( <RevisionsCodeDiff /> );

		expect(
			screen.getByRole( 'row', { name: /Added.*<p>Oldest<\/p>/ } )
		).toHaveClass( 'is-added' );
	} );

	it( 'preserves blank source lines without inserting text', () => {
		mockRevisions( {
			currentContent: 'First\n\nLast',
			showDiff: false,
		} );

		render( <RevisionsCodeDiff /> );

		expect(
			screen.getByText( '', {
				selector: '.editor-revisions-code-diff__code code',
				normalizer: ( content ) => content,
			} )
		).toBeEmptyDOMElement();
	} );
} );
