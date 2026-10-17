import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { createPortal, useState } from '@wordpress/element';
import StyleProvider from '../../style-provider';
import InputControl from '..';

function ControlFrame() {
	const [ frame, setFrame ] = useState< HTMLIFrameElement | null >( null );
	const doc = frame?.contentDocument;
	return (
		<iframe title="InputControl document" ref={ setFrame }>
			{ doc &&
				createPortal(
					<StyleProvider document={ doc }>
						<InputControl label="Long input label" />
					</StyleProvider>,
					doc.body
				) }
		</iframe>
	);
}

it( 'keeps space beside the label in root and iframe documents', async () => {
	await render(
		<>
			<InputControl label="Long input label" />
			<ControlFrame />
		</>
	);
	const frame = document.querySelector(
		'iframe[title="InputControl document"]'
	) as HTMLIFrameElement;
	for ( const style of document.head.querySelectorAll(
		'style[data-vite-dev-id]'
	) ) {
		frame.contentDocument!.head.appendChild( style.cloneNode( true ) );
	}
	const flexStyle = document.head.querySelector(
		'style[data-vite-dev-id$="/flex/style.module.scss"]'
	)!;
	frame.contentDocument!.head.appendChild( flexStyle.cloneNode( true ) );
	for ( const doc of [ document, frame.contentDocument! ] ) {
		const label = doc.querySelector( 'label' )!;
		expect(
			doc.defaultView!.getComputedStyle( label.parentElement! ).maxWidth
		).toBe( 'calc(100% - 10px)' );
	}
} );

it.each( [ 'inherit', 'INHERIT', ' inherit ' ] )(
	'preserves inherited input width for %j',
	async ( width ) => {
		await render(
			<InputControl
				label="Input"
				__unstableInputWidth={ width }
				style={ { width: 240, alignItems: 'flex-start' } }
			/>
		);
		const container = document.querySelector(
			'.components-input-control__container'
		)!;
		expect( getComputedStyle( container ).width ).toBe( '240px' );
	}
);

it.each( [ 'inherit', 'INHERIT', ' inherit ' ] )(
	'preserves the edge flex fallback for %j',
	async ( width ) => {
		await render(
			<InputControl
				label="Input"
				labelPosition="edge"
				__unstableInputWidth={ width }
			/>
		);
		const container = document.querySelector(
			'.components-input-control__container'
		)!;
		expect( getComputedStyle( container ).flex ).toBe( '1 1 0%' );
	}
);
