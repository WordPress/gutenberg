import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { createPortal, useState } from '@wordpress/element';
import StyleProvider from '../../../style-provider';
import DatePicker from '..';

function CalendarFrame() {
	const [ frame, setFrame ] = useState< HTMLIFrameElement | null >( null );
	const frameDocument = frame?.contentDocument;
	return (
		<iframe title="Calendar document" ref={ setFrame }>
			{ frameDocument &&
				createPortal(
					<StyleProvider document={ frameDocument }>
						<DatePicker currentDate="2026-10-14T11:00:00" />
					</StyleProvider>,
					frameDocument.body
				) }
		</iframe>
	);
}

it( 'keeps month navigation aligned with the calendar in root and iframe documents', async () => {
	await render(
		<>
			<DatePicker currentDate="2026-10-14T11:00:00" />
			<CalendarFrame />
		</>
	);
	const frame = document.querySelector(
		'iframe[title="Calendar document"]'
	) as HTMLIFrameElement;
	// Vite serves module styles in the test document. Copy the real compiled
	// styles after Emotion's iframe cache to exercise the opposite style order.
	for ( const style of document.head.querySelectorAll(
		'style[data-vite-dev-id]'
	) ) {
		frame.contentDocument!.head.appendChild( style.cloneNode( true ) );
	}
	for ( const doc of [ document, frame.contentDocument! ] ) {
		const calendar = doc.querySelector( '.components-datetime__date' )!;
		const navigation = calendar.firstElementChild!;
		const styles = doc.defaultView!.getComputedStyle( navigation );
		expect( styles.display ).toBe( 'grid' );
		expect( styles.gridTemplateColumns.split( ' ' ) ).toHaveLength( 7 );
		expect( styles.columnGap ).toBe( '8px' );
		expect( styles.marginBottom ).toBe( '16px' );
	}
} );
