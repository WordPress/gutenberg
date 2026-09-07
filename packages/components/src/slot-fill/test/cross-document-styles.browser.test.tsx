import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createPortal, useState } from '@wordpress/element';
import { registerStyle } from '@wordpress/style-runtime';
import { Slot, Fill, Provider } from '../';

type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: unknown;
};

function IframePortal( { children }: { children: React.ReactNode } ) {
	const [ iframe, setIframe ] = useState< HTMLIFrameElement | null >( null );
	const body = iframe?.contentDocument?.body;

	return (
		<iframe title="Slot document" ref={ setIframe }>
			{ body && createPortal( children, body ) }
		</iframe>
	);
}

describe( 'Slot cross-document styles', () => {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	afterEach( () => {
		delete globalScope.__wpStyleRuntime;
		document.head.innerHTML = '';
	} );

	it( 'injects registered SCSS module styles into the Slot document', () => {
		const styleHash = 'slot-fill-cross-document-style';
		const css = '.slot-fill-cross-document{padding:32px;}';

		registerStyle( styleHash, css );

		render(
			<Provider>
				<IframePortal>
					<Slot name="cross-document" bubblesVirtually />
				</IframePortal>
				<Fill name="cross-document">
					<div className="slot-fill-cross-document">
						Styled content
					</div>
				</Fill>
			</Provider>
		);
		const iframe = screen.getByTitle(
			'Slot document'
		) as HTMLIFrameElement;
		const iframeDocument = iframe.contentDocument!;
		const iframeWindow = iframe.contentWindow!;

		const styledElement = within( iframeDocument.body ).getByText(
			'Styled content'
		);
		expect( iframeWindow.getComputedStyle( styledElement ).padding ).toBe(
			'32px'
		);
	} );
} );
