/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import RevisionsCodeDiff, { getCodeDiffRows } from '../revisions-code-diff';

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
	showDiff = true,
} = {} ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getCurrentRevision: () => ( {
				content: { raw: currentContent },
			} ),
			getPreviousRevision: () => ( {
				content: { raw: previousContent },
			} ),
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
	} );
} );
