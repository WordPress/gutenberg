/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
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

	it( 'offers Restore for ordinary conflicts regardless of capability', () => {
		window._wpCollaborationCanUnfilteredHtml = false;
		render(
			<ReviewGroup
				items={ [ conflictItem( 'frame-conflict' ) ] }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();
	} );

	it( 'reserves Restore of requires-approval conflicts for unfiltered_html holders', () => {
		window._wpCollaborationCanUnfilteredHtml = false;
		render(
			<ReviewGroup
				items={ [ conflictItem( 'requires-approval' ) ] }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.queryByRole( 'button', { name: 'Restore' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByText( /Only someone allowed to publish unfiltered/ )
		).toBeVisible();
		// Discard stays available to everyone.
		expect(
			screen.getByRole( 'button', { name: 'Discard' } )
		).toBeVisible();
	} );

	it( 'explains that restoring a requires-approval conflict publishes under the restorer', () => {
		window._wpCollaborationCanUnfilteredHtml = true;
		render(
			<ReviewGroup
				items={ [ conflictItem( 'requires-approval' ) ] }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();
		expect(
			screen.getByText( /publishes the content under your account/ )
		).toBeVisible();
	} );
} );
