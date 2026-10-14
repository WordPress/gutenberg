import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { createPortal, useState } from '@wordpress/element';
import StyleProvider from '../../style-provider';
import SelectControl from '..';

const options = [ { label: 'One', value: 'one' } ];

function ControlFrame() {
	const [ frame, setFrame ] = useState< HTMLIFrameElement | null >( null );
	const doc = frame?.contentDocument;
	return (
		<iframe title="SelectControl document" ref={ setFrame }>
			{ doc &&
				createPortal(
					<StyleProvider document={ doc }>
						<SelectControl
							label="Select"
							options={ options }
							variant="minimal"
						/>
					</StyleProvider>,
					doc.body
				) }
		</iframe>
	);
}

it( 'uses inline-flex for the minimal variant in root and iframe documents', async () => {
	await render(
		<>
			<SelectControl
				label="Select"
				options={ options }
				variant="minimal"
			/>
			<ControlFrame />
		</>
	);
	const frame = document.querySelector(
		'iframe[title="SelectControl document"]'
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
		const root = doc.querySelector(
			'.components-input-control__container'
		)!.parentElement!;
		expect( doc.defaultView!.getComputedStyle( root ).display ).toBe(
			'inline-flex'
		);
	}
} );
