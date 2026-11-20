import { expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import * as Notice from '../index';

it( 'separates lines and paragraphs and omits hidden text from the announcement', async () => {
	const { rerender } = await render( <Notice.List /> );
	await rerender(
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
					<p>Check your connection.</p>
					<div>
						Re
						<p style={ { visibility: 'hidden' } }>Hidden hint</p>
						try<span aria-hidden="true">Decoration</span>.
					</div>
					<div>
						Contact support
						<br style={ { visibility: 'hidden' } } />
						<span aria-hidden="true">Decoration</span>.
					</div>
					<span style={ { display: 'none' } }>Hidden hint</span>
				</Notice.Description>
				<div style={ { display: 'none' } }>
					<Notice.Description>Hidden description</Notice.Description>
				</div>
			</Notice.Root>
		</Notice.List>
	);

	await waitFor( () =>
		expect( screen.getByRole( 'status' ) ).toHaveProperty(
			'textContent',
			'Save failed! Retry\nlater.\n\nCheck your connection.\n\nRetry.\nContact support.'
		)
	);
} );

it( 'keeps a notice added under a hidden shadow host silent when revealed', async () => {
	const { container: host } = await render( <></> );
	const container = document.createElement( 'div' );
	host.attachShadow( { mode: 'open' } ).appendChild( container );
	const list = ( message?: string, showAction = false ) => (
		<Notice.List liveRegionContainer={ document.body }>
			{ message && (
				<Notice.Root>
					<Notice.Description>{ message }</Notice.Description>
					{ showAction && <Notice.CloseIconButton /> }
				</Notice.Root>
			) }
		</Notice.List>
	);
	const { rerender } = await render( list(), { container } );
	const status = screen.getByRole( 'status' );
	host.style.display = 'none';
	await rerender( list( 'Saved.' ) );
	expect( status ).toBeEmptyDOMElement();

	host.style.display = '';
	await rerender( list( 'Saved.', true ) );
	expect( status ).toBeEmptyDOMElement();
	await rerender( list( 'Updated.', true ) );
	await waitFor( () => expect( status ).toHaveTextContent( 'Updated.' ) );
} );

it( 'announces the rendered summary of a closed disclosure', async () => {
	const { rerender } = await render( <Notice.List /> );
	await rerender(
		<Notice.List>
			<Notice.Root>
				<Notice.Description render={ <div /> }>
					<details>
						<summary>
							{ 'Save\noptions' }
							<span aria-hidden="true">+</span>
						</summary>
						Private diagnostics
					</details>
				</Notice.Description>
			</Notice.Root>
		</Notice.List>
	);

	await waitFor( () =>
		expect( screen.getByRole( 'status' ) ).toHaveProperty(
			'textContent',
			'Save options'
		)
	);
} );

it( 'applies and removes an explicit override that matches the unformatted text', async () => {
	const { rerender } = await render( <Notice.List /> );
	const list = ( spokenMessage?: string ) => (
		<Notice.List>
			<Notice.Root spokenMessage={ spokenMessage }>
				<Notice.Description>
					Retry
					<br />
					later
				</Notice.Description>
			</Notice.Root>
		</Notice.List>
	);
	const status = screen.getByRole( 'status' );
	await rerender( list() );
	await waitFor( () =>
		expect( status ).toHaveProperty( 'textContent', 'Retry\nlater' )
	);
	await rerender( list( 'Retrylater' ) );
	await waitFor( () =>
		expect( status ).toHaveProperty( 'textContent', 'Retrylater' )
	);
	await rerender( list() );
	await waitFor( () =>
		expect( status ).toHaveProperty( 'textContent', 'Retry\nlater' )
	);
} );

it( 'keeps an initial notice silent when its override matches the rendered message', async () => {
	const notice = ( spokenMessage?: string ) => (
		<Notice.List>
			<Notice.Root spokenMessage={ spokenMessage }>
				<Notice.Description>Saved</Notice.Description>
			</Notice.Root>
		</Notice.List>
	);
	const { rerender } = await render( notice() );
	const status = screen.getByRole( 'status' );
	await rerender( notice( 'Saved' ) );
	expect( status ).toBeEmptyDOMElement();
	await rerender( notice() );
	expect( status ).toBeEmptyDOMElement();
} );

it( 'updates an existing announcement when an override and its visible content change together', async () => {
	const { rerender } = await render( <Notice.List /> );
	const list = ( offline: boolean ) => (
		<Notice.List>
			<Notice.Root
				spokenMessage={ offline ? 'Saved offline' : undefined }
			>
				<Notice.Description>
					Saved
					<span style={ { display: offline ? undefined : 'none' } }>
						{ ' ' }
						offline
					</span>
				</Notice.Description>
			</Notice.Root>
		</Notice.List>
	);
	const status = screen.getByRole( 'status' );
	await rerender( list( false ) );
	await waitFor( () =>
		expect( status ).toHaveProperty( 'textContent', 'Saved' )
	);
	await rerender( list( true ) );
	await waitFor( () =>
		expect( status ).toHaveProperty( 'textContent', 'Saved offline' )
	);
} );
