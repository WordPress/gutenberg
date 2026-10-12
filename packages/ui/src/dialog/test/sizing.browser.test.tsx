import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ReactNode } from 'react';
import '@wordpress/theme/design-tokens.css';
import * as Dialog from '..';
import { ThemeProvider } from '../../utils/theme-provider';

describe( 'Dialog sizing', () => {
	function Example( {
		size = 'auto',
		children,
	}: {
		size?: 'auto' | 'medium';
		children?: ReactNode;
	} ) {
		return (
			<ThemeProvider isRoot>
				<Dialog.Root defaultOpen>
					<Dialog.Popup size={ size }>
						<Dialog.Header>
							<Dialog.Title>Preview</Dialog.Title>
							<Dialog.CloseIconButton />
						</Dialog.Header>
						<Dialog.Content>{ children }</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			</ThemeProvider>
		);
	}

	beforeEach( async () => {
		await page.viewport( 1200, 800 );
	} );

	afterEach( async () => {
		await page.viewport( 1200, 800 );
	} );

	it( 'fits content and resizes when the content width changes', async () => {
		const view = await render(
			<Example>
				<div style={ { width: 450 } }>Preview content</div>
			</Example>
		);
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		const padding = 2 * 24 + 2;
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 450 + padding );

		await view.rerender(
			<Example>
				<div style={ { width: 750 } }>Preview content</div>
			</Example>
		);
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 750 + padding );
	} );

	it( 'keeps the responsive minimum for short content', async () => {
		await render( <Example>Short content</Example> );
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 400 );
		await page.viewport( 479, 800 );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 320 );
		await page.viewport( 480, 800 );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 400 );
	} );

	it( 'shrinks below the minimum to fit a narrow viewport', async () => {
		await page.viewport( 320, 800 );
		await render( <Example>Short content</Example> );
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 272 );
		await expect
			.poll( () => popup.getBoundingClientRect().left )
			.toBe( 24 );
	} );

	it( 'caps wide content at the viewport inset and wraps long text', async () => {
		await render(
			<Example>
				<p>{ 'Long content that needs to wrap. '.repeat( 100 ) }</p>
			</Example>
		);
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		const text = screen.getByText( /Long content that needs to wrap/ );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 1152 );
		expect( text.scrollWidth ).toBe( text.clientWidth );
		await page.viewport( 320, 800 );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 272 );
		expect( text.scrollWidth ).toBe( text.clientWidth );
	} );

	it( 'keeps the medium width when auto is not selected', async () => {
		await render( <Example size="medium">Short content</Example> );
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 560 );
	} );

	it( 'fits a responsive image within the viewport', async () => {
		await render(
			<Example>
				<img
					alt="Preview"
					src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2000' height='300'/%3E"
					width={ 2000 }
					height={ 300 }
					style={ { maxWidth: '100%', height: 'auto' } }
				/>
			</Example>
		);
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		const image = screen.getByRole( 'img', { name: 'Preview' } );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 1152 );
		expect( image.getBoundingClientRect().width ).toBe( 1102 );
		await page.viewport( 320, 800 );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 272 );
		expect( image.getBoundingClientRect().width ).toBe( 222 );
	} );

	it( 'keeps the medium width when size is omitted', async () => {
		await render(
			<ThemeProvider isRoot>
				<Dialog.Root defaultOpen>
					<Dialog.Popup>
						<Dialog.Title>Preview</Dialog.Title>
						<Dialog.Action>Close</Dialog.Action>
					</Dialog.Popup>
				</Dialog.Root>
			</ThemeProvider>
		);
		const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( 560 );
	} );
} );

it.each( [
	[ 'small', 400 ],
	[ 'medium', 560 ],
	[ 'large', 960 ],
	[ 'stretch', 1152 ],
	[ 'full', 1152 ],
] as const )( 'keeps the Dialog %s preset width', async ( size, width ) => {
	await page.viewport( 1200, 800 );
	await render(
		<ThemeProvider isRoot>
			<Dialog.Root defaultOpen>
				<Dialog.Popup size={ size }>
					<Dialog.Title>Preview</Dialog.Title>
					<Dialog.Action>Close</Dialog.Action>
				</Dialog.Popup>
			</Dialog.Root>
		</ThemeProvider>
	);
	const popup = screen.getByRole( 'dialog', { name: 'Preview' } );
	await expect
		.poll( () => popup.getBoundingClientRect().width )
		.toBe( width );
} );
