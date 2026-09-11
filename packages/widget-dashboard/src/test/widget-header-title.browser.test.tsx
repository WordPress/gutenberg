import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { Tooltip } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetHeader } from '../components/widget-header';

const LONG_TITLE = 'Traffic Snapshot Against the Quarterly Revenue Target';
const SHORT_TITLE = 'Traffic';

function widgetTypeWith( title: string ): WidgetType {
	return {
		apiVersion: 1,
		name: 'test/traffic',
		title,
		renderModule: 'test-traffic',
	} as WidgetType;
}

function Header( { title, width }: { title: string; width: number } ) {
	return (
		<Tooltip.Provider delay={ 0 }>
			<div style={ { width } }>
				<WidgetHeader
					widgetType={ widgetTypeWith( title ) }
					titleId="tile-title"
					showIdentity
				/>
			</div>
		</Tooltip.Provider>
	);
}

describe( 'WidgetHeader title', () => {
	it( 'shows the full title in a tooltip on hover when the row clips it', async () => {
		await render( <Header title={ LONG_TITLE } width={ 240 } /> );

		const heading = screen.getByRole( 'heading', { name: LONG_TITLE } );
		await waitFor( () =>
			expect( heading.scrollWidth ).toBeGreaterThan( heading.clientWidth )
		);

		await userEvent.hover( heading );

		await waitFor( () =>
			expect( screen.getAllByText( LONG_TITLE ) ).toHaveLength( 2 )
		);
	} );

	it( 'makes a clipped title focusable and shows the tooltip on focus', async () => {
		await render( <Header title={ LONG_TITLE } width={ 240 } /> );

		const heading = screen.getByRole( 'heading', { name: LONG_TITLE } );
		await waitFor( () =>
			expect( heading ).toHaveAttribute( 'tabindex', '0' )
		);

		await userEvent.keyboard( '{Tab}' );

		expect( heading ).toHaveFocus();
		await waitFor( () =>
			expect( screen.getAllByText( LONG_TITLE ) ).toHaveLength( 2 )
		);
	} );

	it( 'keeps focus on the title when a resize un-clips it', async () => {
		const view = await render(
			<Header title={ LONG_TITLE } width={ 240 } />
		);

		const heading = screen.getByRole( 'heading', { name: LONG_TITLE } );
		await waitFor( () =>
			expect( heading ).toHaveAttribute( 'tabindex', '0' )
		);
		await userEvent.keyboard( '{Tab}' );
		expect( heading ).toHaveFocus();

		await view.rerender( <Header title={ LONG_TITLE } width={ 640 } /> );

		await waitFor( () =>
			expect( heading.scrollWidth ).toBeLessThanOrEqual(
				heading.clientWidth
			)
		);
		expect( heading ).toHaveFocus();
		expect( heading ).toHaveAttribute( 'tabindex', '0' );

		await userEvent.keyboard( '{Tab}' );
		expect( heading ).not.toHaveFocus();
		await waitFor( () =>
			expect( heading ).not.toHaveAttribute( 'tabindex' )
		);
	} );

	it( 'leaves a title that fits alone: no tooltip, not focusable', async () => {
		await render( <Header title={ SHORT_TITLE } width={ 480 } /> );

		const heading = screen.getByRole( 'heading', { name: SHORT_TITLE } );
		expect( heading.scrollWidth ).toBeLessThanOrEqual(
			heading.clientWidth
		);
		expect( heading ).not.toHaveAttribute( 'tabindex' );

		await userEvent.hover( heading );

		// The popup mounts asynchronously, so give a wrongly enabled tooltip a
		// chance to appear before asserting it never did.
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		expect( screen.getAllByText( SHORT_TITLE ) ).toHaveLength( 1 );
	} );

	it( "keeps the title id so the tile's labelled region still resolves", async () => {
		await render( <Header title={ LONG_TITLE } width={ 240 } /> );

		expect(
			screen.getByRole( 'heading', { name: LONG_TITLE } )
		).toHaveAttribute( 'id', 'tile-title' );
	} );
} );
