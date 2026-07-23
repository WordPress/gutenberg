/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { RevisionsSlider } from '../revisions-slider';

const noop = () => {};

function getRevisionsSlider( revisions ) {
	return (
		<RevisionsSlider
			revisions={ revisions }
			perPage={ 100 }
			currentRevisionId={ 2 }
			revisionKey="id"
			revisionPage={ 1 }
			totalRevisions={ 2 }
			setCurrentRevisionId={ noop }
			setRevisionPage={ noop }
		/>
	);
}

describe( 'RevisionsSlider', () => {
	it( 'focuses the slider when revisions load without user interaction', () => {
		const { rerender } = render( getRevisionsSlider() );

		rerender(
			getRevisionsSlider( [
				{ id: 2, date: '2026-07-14T12:00:00' },
				{ id: 1, date: '2026-07-14T11:00:00' },
			] )
		);

		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).toHaveFocus();
	} );

	it( 'does not focus after pointer interaction while revisions load', () => {
		const { rerender } = render(
			<>
				<button>Options</button>
				{ getRevisionsSlider() }
			</>
		);
		const optionsButton = screen.getByRole( 'button', { name: 'Options' } );

		fireEvent.pointerDown( optionsButton );
		expect( document.body ).toHaveFocus();
		rerender(
			<>
				<button>Options</button>
				{ getRevisionsSlider( [
					{ id: 2, date: '2026-07-14T12:00:00' },
					{ id: 1, date: '2026-07-14T11:00:00' },
				] ) }
			</>
		);

		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).not.toHaveFocus();
		expect( document.body ).toHaveFocus();
	} );
} );
