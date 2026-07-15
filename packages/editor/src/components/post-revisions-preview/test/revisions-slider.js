/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import RevisionsSlider from '../revisions-slider';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch/use-dispatch', () =>
	jest.fn()
);

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( object ) => ( {
		...object,
		registerPrivateActions: jest.fn(),
		registerPrivateSelectors: jest.fn(),
	} ),
} ) );

describe( 'RevisionsSlider', () => {
	let revisions;

	beforeEach( () => {
		revisions = undefined;
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentPostType: () => 'post',
				getCurrentRevisionId: () => 2,
				getRevisionPage: () => 1,
				getPageRevisions: () => revisions,
				getRevisionsPerPage: () => 100,
				getCurrentPostRevisionsCount: () => 2,
				getEntityConfig: () => ( { revisionKey: 'id' } ),
			} ) )
		);
		useDispatch.mockReturnValue( {
			setCurrentRevisionId: jest.fn(),
			setRevisionPage: jest.fn(),
		} );
	} );

	it( 'focuses the slider when revisions load without user interaction', () => {
		const { rerender } = render( <RevisionsSlider /> );

		revisions = [
			{ id: 2, date: '2026-07-14T12:00:00' },
			{ id: 1, date: '2026-07-14T11:00:00' },
		];
		rerender( <RevisionsSlider /> );

		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).toHaveFocus();
	} );

	it( 'does not focus after pointer interaction while revisions load', () => {
		const { rerender } = render(
			<>
				<button>Options</button>
				<RevisionsSlider />
			</>
		);
		const optionsButton = screen.getByRole( 'button', { name: 'Options' } );

		fireEvent.pointerDown( optionsButton );
		expect( document.body ).toHaveFocus();
		revisions = [
			{ id: 2, date: '2026-07-14T12:00:00' },
			{ id: 1, date: '2026-07-14T11:00:00' },
		];
		rerender(
			<>
				<button>Options</button>
				<RevisionsSlider />
			</>
		);

		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).not.toHaveFocus();
		expect( document.body ).toHaveFocus();
	} );
} );
