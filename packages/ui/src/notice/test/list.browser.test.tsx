import { expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import * as Notice from '../index';

it( 'preserves formatted announcements across list visibility changes', async () => {
	const { rerender } = await render(
		<Notice.List liveRegionContainer={ document.body } />
	);
	const notice = ( showHint: boolean, hidden = false, decorated = false ) => (
		<Notice.List hidden={ hidden } liveRegionContainer={ document.body }>
			<Notice.Root>
				<Notice.Title>
					Save{ '  ' }
					<strong>failed</strong>!
					{ decorated && <span aria-hidden="true">Decoration</span> }
				</Notice.Title>
				<Notice.Description render={ <div /> }>
					<p>
						Retry
						<br />
						later &amp; reopen.
						<span aria-hidden="true">Decoration</span>
						<span hidden>Hidden detail</span>
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
			'Save failed! Retry\nlater & reopen.'
		)
	);
	await rerender( notice( false, false, true ) );
	expect( status ).toHaveProperty(
		'textContent',
		'Save failed! Retry\nlater & reopen.'
	);
	await rerender( notice( false, true ) );
	await waitFor( () => expect( status ).toBeEmptyDOMElement() );
	await rerender( notice( false ) );
	expect( status ).toBeEmptyDOMElement();
	await rerender( notice( true ) );
	await waitFor( () =>
		expect( status ).toHaveProperty(
			'textContent',
			'Save failed! Retry\nlater & reopen.\n\nCheck your connection.'
		)
	);
	await rerender( notice( true, true ) );
	await waitFor( () => expect( status ).toBeEmptyDOMElement() );
	await rerender( notice( false, true ) );
	await rerender( notice( false ) );
	expect( status ).toBeEmptyDOMElement();
} );
