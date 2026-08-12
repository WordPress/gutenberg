import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevisionsSlider } from '../revisions-slider';

const noop = () => {};
const loadedRevisions = [
	{ id: 2, date: '2026-07-14T12:00:00' },
	{ id: 1, date: '2026-07-14T11:00:00' },
];

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

		rerender( getRevisionsSlider( loadedRevisions ) );

		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).toHaveFocus();
	} );

	it( 'focuses the slider after a key press that does not move focus while revisions load', async () => {
		const user = userEvent.setup();
		const { rerender } = render( getRevisionsSlider() );

		await user.keyboard( '{Escape}' );
		expect( document.body ).toHaveFocus();

		rerender( getRevisionsSlider( loadedRevisions ) );

		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).toHaveFocus();
	} );

	it( 'keeps focus on another control when revisions load', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<>
				<button>Options</button>
				{ getRevisionsSlider() }
			</>
		);
		const optionsButton = screen.getByRole( 'button', {
			name: 'Options',
		} );

		await user.click( optionsButton );
		expect( optionsButton ).toHaveFocus();

		rerender(
			<>
				<button>Options</button>
				{ getRevisionsSlider( loadedRevisions ) }
			</>
		);

		expect( optionsButton ).toHaveFocus();
		expect(
			screen.getByRole( 'slider', { name: 'Revision' } )
		).not.toHaveFocus();
	} );
} );
