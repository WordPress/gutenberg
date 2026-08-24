import { render, screen } from '@testing-library/react';
import ReviewGroup from '../review-group';

const conflictItem = ( reason ) => ( {
	id: 'i1',
	unitId: 'u1',
	isLocal: false,
	actorId: 'a1',
	reason,
	intentType: 'insert_block',
	summary: 'core/html: <script>x</script>',
} );

describe( 'ReviewGroup', () => {
	afterEach( () => {
		delete window._wpCollaborationCanUnfilteredHtml;
	} );

	it( 'offers Adopt for ordinary conflicts regardless of capability', () => {
		window._wpCollaborationCanUnfilteredHtml = false;
		render(
			<ReviewGroup
				items={ [ conflictItem( 'frame-conflict' ) ] }
				onResolve={ () => {} }
			/>
		);
		expect( screen.getByRole( 'button', { name: 'Adopt' } ) ).toBeVisible();
	} );

	it( 'reserves Adopt of requires-approval conflicts for unfiltered_html holders', () => {
		window._wpCollaborationCanUnfilteredHtml = false;
		render(
			<ReviewGroup
				items={ [ conflictItem( 'requires-approval' ) ] }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.queryByRole( 'button', { name: 'Adopt' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByText( /Only someone allowed to publish unfiltered/ )
		).toBeVisible();
		// Reject stays available to everyone.
		expect(
			screen.getByRole( 'button', { name: 'Reject' } )
		).toBeVisible();
	} );

	it( 'explains that adopting a requires-approval conflict publishes under the adopter', () => {
		window._wpCollaborationCanUnfilteredHtml = true;
		render(
			<ReviewGroup
				items={ [ conflictItem( 'requires-approval' ) ] }
				onResolve={ () => {} }
			/>
		);
		expect( screen.getByRole( 'button', { name: 'Adopt' } ) ).toBeVisible();
		expect(
			screen.getByText( /publishes the content under your account/ )
		).toBeVisible();
	} );

	it( 'summary-only renders no verbs: resolution lives at the inline block card', () => {
		render(
			<ReviewGroup
				items={ [ conflictItem( 'frame-conflict' ) ] }
				onResolve={ () => {} }
				summaryOnly
				onNavigate={ () => {} }
			/>
		);
		expect(
			screen.queryByRole( 'button', { name: 'Adopt' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Reject' } )
		).not.toBeInTheDocument();
		// The attribution remains a navigation link to the block.
		expect(
			screen.getByRole( 'button', {
				name: 'Go to the conflicted block',
			} )
		).toBeVisible();
		expect( screen.getByText( /Lost content/ ) ).toBeVisible();
	} );
} );
