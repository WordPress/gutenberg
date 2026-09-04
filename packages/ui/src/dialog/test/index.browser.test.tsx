import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import './index.browser.test.module.css';
import { Button } from '../../button';
import { TextareaControl } from '../../form/textarea-control';
import * as Dialog from '../index';

const GEOMETRY_TOLERANCE = 0.5;
const POPUP_STYLE = {
	height: 320,
	transition: 'none',
};

function getOutlineExtent( element: HTMLElement ) {
	const style = getComputedStyle( element );

	return (
		Number.parseFloat( style.outlineWidth ) +
		Number.parseFloat( style.outlineOffset )
	);
}

afterEach( () => cleanup() );

describe( 'Dialog focus ring clipping', () => {
	it( "keeps a last control's focus ring visible above a pinned footer", async () => {
		render(
			<Dialog.Root open>
				<Dialog.Popup style={ POPUP_STYLE }>
					<Dialog.Header>
						<Dialog.Title>Preferences</Dialog.Title>
					</Dialog.Header>
					<Dialog.Content data-testid="footer-dialog-content">
						<div style={ { height: 400 } } aria-hidden />
						<TextareaControl label="Notes" />
					</Dialog.Content>
					<Dialog.Footer>
						<Dialog.Action>Save</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		const content = await screen.findByTestId( 'footer-dialog-content' );
		const textarea = screen.getByRole( 'textbox', { name: 'Notes' } );
		const focusRing = textarea.parentElement!;

		content.scrollTop = content.scrollHeight;
		await userEvent.click( textarea );

		const contentRect = content.getBoundingClientRect();
		const focusRingRect = focusRing.getBoundingClientRect();
		const outlineExtent = getOutlineExtent( focusRing );

		expect( textarea.ownerDocument.activeElement ).toBe( textarea );
		expect( outlineExtent ).toBeGreaterThan( 0 );
		expect( focusRingRect.bottom + outlineExtent ).toBeLessThanOrEqual(
			contentRect.bottom + GEOMETRY_TOLERANCE
		);
	} );

	it( "keeps a first control's focus ring visible below a pinned header", async () => {
		render(
			<Dialog.Root open>
				<Dialog.Popup style={ POPUP_STYLE }>
					<Dialog.Header>
						<Dialog.Title>Preferences</Dialog.Title>
					</Dialog.Header>
					<Dialog.Content data-testid="header-dialog-content">
						<Button>First action</Button>
						<div style={ { height: 400 } } aria-hidden />
					</Dialog.Content>
					<Dialog.Footer>
						<Dialog.Action>Save</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		const content = await screen.findByTestId( 'header-dialog-content' );
		const button = screen.getByRole( 'button', { name: 'First action' } );

		content.scrollTop = 0;
		await userEvent.click( button );

		const contentRect = content.getBoundingClientRect();
		const buttonRect = button.getBoundingClientRect();
		const outlineExtent = getOutlineExtent( button );

		expect( button.ownerDocument.activeElement ).toBe( button );
		expect( outlineExtent ).toBeGreaterThan( 0 );
		expect( buttonRect.top - outlineExtent ).toBeGreaterThanOrEqual(
			contentRect.top - GEOMETRY_TOLERANCE
		);
	} );
} );
