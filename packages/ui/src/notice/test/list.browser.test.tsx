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

it.each( [
	[ 'hidden', 'list' ],
	[ 'hidden', 'ancestor' ],
	[ 'collapse', 'list' ],
	[ 'collapse', 'ancestor' ],
] as const )(
	'does not replay an unchanged implicit message after CSS visibility %s on the %s',
	async ( visibility, target ) => {
		const notice = ( visible: boolean, message = 'Saved.' ) => (
			<section
				style={
					target === 'ancestor'
						? { visibility: visible ? 'visible' : visibility }
						: undefined
				}
			>
				<Notice.List
					style={
						target === 'list'
							? { visibility: visible ? 'visible' : visibility }
							: undefined
					}
					liveRegionContainer={ document.body }
				>
					<Notice.Root>
						<Notice.Description>
							{ message }
							<span style={ { visibility: 'hidden' } }>
								Hidden detail
							</span>
						</Notice.Description>
					</Notice.Root>
				</Notice.List>
			</section>
		);
		const { rerender } = await render( notice( false ) );
		const status = screen.getByRole( 'status' );
		await rerender( notice( true ) );
		expect( status ).toBeEmptyDOMElement();
		await rerender( notice( true, 'Updated.' ) );
		await waitFor( () =>
			expect( status ).toHaveProperty( 'textContent', 'Updated.' )
		);
		await rerender( notice( false, 'Updated.' ) );
		await waitFor( () => expect( status ).toBeEmptyDOMElement() );
		await rerender( notice( true, 'Updated.' ) );
		expect( status ).toBeEmptyDOMElement();
		await rerender( notice( false, 'Updated.' ) );
		await rerender( notice( true, 'Changed on reveal.' ) );
		await waitFor( () =>
			expect( status ).toHaveProperty(
				'textContent',
				'Changed on reveal.'
			)
		);
	}
);
