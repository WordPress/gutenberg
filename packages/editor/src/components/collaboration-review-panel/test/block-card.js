/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { BlockCardBody } from '../markers';

const item = ( overrides = {} ) => ( {
	id: 'i1',
	unitId: 'u1',
	isLocal: false,
	actorId: 'a1',
	reason: 'frame-conflict',
	intentType: 'proposal',
	summary: 'lost words',
	...overrides,
} );

describe( 'BlockCardBody', () => {
	afterEach( () => {
		delete window._wpCollaborationCanUnfilteredHtml;
	} );

	it( 'renders ONE merged task with the two verbs and no count chip', () => {
		render(
			<BlockCardBody
				groups={ [
					[ item() ],
					[ item( { id: 'i2', unitId: 'u2', summary: 'more' } ) ],
				] }
				onResolve={ () => {} }
			/>
		);
		// One card: one Adopt, one Reject — never per-group verb pairs.
		expect(
			screen.getAllByRole( 'button', { name: 'Adopt' } )
		).toHaveLength( 1 );
		expect(
			screen.getAllByRole( 'button', { name: 'Reject' } )
		).toHaveLength( 1 );
		// The merged summary carries both groups' content; no numeric badge.
		expect( screen.getByText( /lost words more/ ) ).toBeVisible();
		expect( screen.queryByText( '2' ) ).not.toBeInTheDocument();
	} );

	it( 'Adopt resolves every item on the block as restored', async () => {
		const user = userEvent.setup();
		const onResolve = jest.fn();
		const items = [ item(), item( { id: 'i2', unitId: 'u2' } ) ];
		render(
			<BlockCardBody
				groups={ [ [ items[ 0 ] ], [ items[ 1 ] ] ] }
				onResolve={ onResolve }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Adopt' } ) );
		expect( onResolve ).toHaveBeenCalledWith( items, 'restored' );
	} );

	it( 'Reject resolves every item on the block as dismissed', async () => {
		const user = userEvent.setup();
		const onResolve = jest.fn();
		const items = [ item(), item( { id: 'i2', unitId: 'u2' } ) ];
		render(
			<BlockCardBody
				groups={ [ [ items[ 0 ] ], [ items[ 1 ] ] ] }
				onResolve={ onResolve }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Reject' } ) );
		expect( onResolve ).toHaveBeenCalledWith( items, 'dismissed' );
	} );

	it( 'attributes local pending edits as yours', () => {
		render(
			<BlockCardBody
				groups={ [ [ item( { isLocal: true } ) ] ] }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.getByText( /Your edit on this block is pending/ )
		).toBeVisible();
	} );

	it( 'reserves Adopt for unfiltered_html holders when any item requires approval', () => {
		window._wpCollaborationCanUnfilteredHtml = false;
		render(
			<BlockCardBody
				groups={ [
					[ item() ],
					[
						item( {
							id: 'i2',
							unitId: 'u2',
							reason: 'requires-approval',
						} ),
					],
				] }
				onResolve={ () => {} }
			/>
		);
		expect(
			screen.queryByRole( 'button', { name: 'Adopt' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByText( /Only someone allowed to publish unfiltered/ )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Reject' } )
		).toBeVisible();
	} );
} );
