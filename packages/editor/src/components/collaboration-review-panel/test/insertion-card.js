/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { InsertionCardBody } from '../markers';

const insertionItem = () => ( {
	id: 'ins-1',
	unitId: 'ins-1',
	isLocal: false,
	actorId: 'a1',
	reason: 'requires-approval',
	intentType: 'insert_block',
	proposedInsertion: {
		blockType: 'core/html',
		html: '<script>alert(1)</script>',
		afterSiblingId: 'p1',
	},
} );

describe( 'InsertionCardBody', () => {
	afterEach( () => {
		delete window._wpCollaborationCanUnfilteredHtml;
	} );

	it( 'previews the proposed markup as inert text, never live DOM', () => {
		render(
			<InsertionCardBody
				item={ insertionItem() }
				onResolve={ () => {} }
			/>
		);
		// Finding the literal tag as TEXT proves it was not parsed into a
		// live element — an innerHTML'd script would not have a matching
		// text node.
		expect( screen.getByText( '<script>alert(1)</script>' ) ).toBeVisible();
	} );

	it( 'gates Approve on the unfiltered_html capability; Discard is universal', () => {
		window._wpCollaborationCanUnfilteredHtml = false;
		const { rerender } = render(
			<InsertionCardBody
				item={ insertionItem() }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.queryByRole( 'button', { name: 'Approve' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Discard' } )
		).toBeVisible();

		window._wpCollaborationCanUnfilteredHtml = true;
		rerender(
			<InsertionCardBody
				item={ insertionItem() }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Approve' } )
		).toBeVisible();
	} );
} );
