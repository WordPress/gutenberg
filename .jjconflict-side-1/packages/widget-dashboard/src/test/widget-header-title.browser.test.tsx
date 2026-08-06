import { screen, waitFor, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetHeader } from '../components/widget-header';

const LONG_TITLE = 'Traffic Snapshot Against the Quarterly Revenue Target';
const SHORT_TITLE = 'Traffic';
const HELP = 'Visits over the last week.';

function widgetTypeWith(
	title: string,
	help?: WidgetType[ 'help' ]
): WidgetType {
	return {
		apiVersion: 1,
		name: 'test/traffic',
		title,
		renderModule: 'test-traffic',
		...( help ? { help } : {} ),
	} as WidgetType;
}

function Header( {
	title,
	width,
	help,
}: {
	title: string;
	width: number;
	help?: WidgetType[ 'help' ];
} ) {
	return (
		<div style={ { width } }>
			<WidgetHeader
				widgetType={ widgetTypeWith( title, help ) }
				titleId="tile-title"
				showIdentity
			/>
		</div>
	);
}

function infotip() {
	return screen.queryByRole( 'button', { name: 'More information' } );
}

async function openInfotip() {
	await userEvent.click(
		await screen.findByRole( 'button', { name: 'More information' } )
	);
	return screen.findByRole( 'dialog' );
}

describe( 'WidgetHeader title', () => {
	it( 'shows the full title in the infotip when the row clips it', async () => {
		await render( <Header title={ LONG_TITLE } width={ 240 } /> );

		const heading = screen.getByRole( 'heading', { name: LONG_TITLE } );
		expect( heading.scrollWidth ).toBeGreaterThan( heading.clientWidth );

		const dialog = await openInfotip();
		expect( dialog ).toHaveAccessibleName( LONG_TITLE );
		expect(
			within( dialog ).getByRole( 'heading', { name: LONG_TITLE } )
		).not.toHaveAttribute( 'data-visually-hidden' );
	} );

	it( 'puts the title above the help note when both apply', async () => {
		await render(
			<Header
				title={ LONG_TITLE }
				width={ 240 }
				help={ { content: HELP } }
			/>
		);

		const dialog = await openInfotip();
		expect(
			within( dialog ).getByRole( 'heading', { name: LONG_TITLE } )
		).not.toHaveAttribute( 'data-visually-hidden' );
		expect( within( dialog ).getByText( HELP ) ).toBeVisible();
	} );

	it( 'keeps the title out of sight in the infotip when it fits', async () => {
		await render(
			<Header
				title={ SHORT_TITLE }
				width={ 480 }
				help={ { content: HELP } }
			/>
		);

		const dialog = await openInfotip();
		expect( dialog ).toHaveAccessibleName( SHORT_TITLE );
		// VisuallyHidden clips rather than hides, so `toBeVisible` cannot tell.
		expect(
			within( dialog ).getByRole( 'heading', { name: SHORT_TITLE } )
		).toHaveAttribute( 'data-visually-hidden' );
		expect( within( dialog ).getByText( HELP ) ).toBeVisible();
	} );

	it( 'renders no infotip for a title that fits and has no help note', async () => {
		await render( <Header title={ SHORT_TITLE } width={ 480 } /> );

		const heading = screen.getByRole( 'heading', { name: SHORT_TITLE } );
		expect( heading.scrollWidth ).toBeLessThanOrEqual(
			heading.clientWidth
		);
		expect( infotip() ).not.toBeInTheDocument();
	} );

	it( 'adds and removes the infotip as a resize clips and un-clips the title', async () => {
		const view = await render(
			<Header title={ LONG_TITLE } width={ 240 } />
		);
		await waitFor( () => expect( infotip() ).toBeInTheDocument() );

		await view.rerender( <Header title={ LONG_TITLE } width={ 640 } /> );
		await waitFor( () => expect( infotip() ).not.toBeInTheDocument() );

		await view.rerender( <Header title={ LONG_TITLE } width={ 240 } /> );
		await waitFor( () => expect( infotip() ).toBeInTheDocument() );
	} );

	it( 'drops the infotip again at the width that first clipped the title', async () => {
		const view = await render(
			<Header title={ LONG_TITLE } width={ 240 } />
		);
		const heading = screen.getByRole( 'heading', { name: LONG_TITLE } );
		await waitFor( () => expect( infotip() ).toBeInTheDocument() );

		// What the container spends besides the title and the infotip.
		const trigger = infotip() as HTMLElement;
		const chrome =
			240 -
			( trigger.getBoundingClientRect().right -
				heading.getBoundingClientRect().left );
		const range = document.createRange();
		range.selectNodeContents( heading );
		// Fits the title, not the title plus infotip.
		const snug = Math.ceil(
			range.getBoundingClientRect().width + chrome + 4
		);

		await view.rerender( <Header title={ LONG_TITLE } width={ snug } /> );
		await waitFor( () => expect( infotip() ).not.toBeInTheDocument() );

		await view.rerender( <Header title={ LONG_TITLE } width={ 240 } /> );
		await waitFor( () => expect( infotip() ).toBeInTheDocument() );

		await view.rerender( <Header title={ LONG_TITLE } width={ snug } /> );
		await waitFor( () => expect( infotip() ).not.toBeInTheDocument() );
	} );

	it( 'opens the infotip on hover', async () => {
		await render( <Header title={ LONG_TITLE } width={ 240 } /> );

		await userEvent.hover(
			await screen.findByRole( 'button', { name: 'More information' } )
		);

		const dialog = await screen.findByRole( 'dialog' );
		expect( dialog ).toHaveAccessibleName( LONG_TITLE );
	} );

	it( "keeps the title id so the tile's labelled region still resolves", async () => {
		await render( <Header title={ LONG_TITLE } width={ 240 } /> );

		expect(
			screen.getByRole( 'heading', { name: LONG_TITLE } )
		).toHaveAttribute( 'id', 'tile-title' );
	} );
} );
