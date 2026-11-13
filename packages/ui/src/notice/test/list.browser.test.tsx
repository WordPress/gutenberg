import { expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import * as Notice from '../index';

it( 'announces formatted titles and descriptions using their visible text', async () => {
	const { rerender } = await render( <Notice.List /> );
	const notice = ( showHint: boolean ) => (
		<Notice.List>
			<Notice.Root>
				<Notice.Title>
					Save <strong>failed</strong>!
				</Notice.Title>
				<Notice.Description render={ <div /> }>
					<p>
						Retry
						<br />
						later.
						<span aria-hidden="true">Decoration</span>
					</p>
					<p style={ { display: showHint ? 'block' : 'none' } }>
						Check your connection.
					</p>
				</Notice.Description>
				<Notice.Description style={ { display: 'none' } }>
					Hidden description
				</Notice.Description>
				<div style={ { display: 'none' } }>
					<Notice.Title>Hidden title</Notice.Title>
				</div>
			</Notice.Root>
		</Notice.List>
	);
	const status = screen.getByRole( 'status' );
	await rerender( notice( false ) );
	await waitFor( () =>
		expect( status ).toHaveProperty(
			'textContent',
			'Save failed! Retry\nlater.'
		)
	);
	await rerender( notice( true ) );
	await waitFor( () =>
		expect( status ).toHaveProperty(
			'textContent',
			'Save failed! Retry\nlater.\n\nCheck your connection.'
		)
	);
} );
