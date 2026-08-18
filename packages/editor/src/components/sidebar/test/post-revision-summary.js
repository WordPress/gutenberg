import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { SlotFillProvider } from '@wordpress/components';
import PostRevisionSummary from '../post-revision-summary';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( object ) => ( {
		...object,
		registerPrivateActions: jest.fn(),
		registerPrivateSelectors: jest.fn(),
	} ),
} ) );

jest.mock( '../../post-card-panel', () => () => null );
jest.mock( '../../revision-fields-diff', () => () => null );
jest.mock( '../../post-revisions-timeline', () => () => null );

function renderSummary() {
	return render(
		<SlotFillProvider>
			<PostRevisionSummary />
		</SlotFillProvider>
	);
}

describe( 'PostRevisionSummary', () => {
	test( 'shows the classic revisions link for the selected revision', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentRevisionId: () => 7,
				getCurrentRevision: () => ( { id: 7 } ),
				getCurrentPostId: () => 1,
				getCurrentPostType: () => 'post',
				getEntityConfig: () => ( { revisionKey: 'id' } ),
			} ) )
		);

		renderSummary();

		const link = screen.getByRole( 'link', {
			name: /Open classic revisions screen/,
		} );
		expect( link ).toBeVisible();
		expect( link ).toHaveAttribute(
			'href',
			expect.stringContaining( 'revision.php' )
		);
		expect( link ).toHaveAttribute(
			'href',
			expect.stringContaining( '7' )
		);
	} );

	test( 'renders nothing when no revision is selected', () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentRevisionId: () => null,
				getCurrentRevision: () => undefined,
				getCurrentPostId: () => 1,
				getCurrentPostType: () => 'post',
				getEntityConfig: () => ( { revisionKey: 'id' } ),
			} ) )
		);

		renderSummary();

		expect(
			screen.queryByRole( 'link', {
				name: 'Open classic revisions screen',
			} )
		).not.toBeInTheDocument();
	} );
} );
