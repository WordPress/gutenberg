import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import * as Breadcrumb from '../index';

function Trail( { width }: { width: number } ) {
	const itemStyle = { display: 'inline-block', width: 80 };

	return (
		<Breadcrumb.Root style={ { width } }>
			<Breadcrumb.LinkItem href="/" style={ itemStyle }>
				Home
			</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem href="/section" style={ itemStyle }>
				Section
			</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem href="/archive" style={ itemStyle }>
				Archive
			</Breadcrumb.LinkItem>
			<Breadcrumb.CurrentItem style={ itemStyle }>
				Current
			</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}

describe( 'Breadcrumb responsive layout', () => {
	it( 'collapses overflowing links at a constrained width', async () => {
		await render( <Trail width={ 180 } /> );

		await waitFor( () => {
			expect(
				screen.getByRole( 'button', {
					name: /hidden breadcrumb items?/,
				} )
			).toBeVisible();
		} );
	} );

	it( 'restores links when the width grows', async () => {
		const view = await render( <Trail width={ 180 } /> );

		const overflowTrigger = await screen.findByRole( 'button', {
			name: /hidden breadcrumb items?/,
		} );
		overflowTrigger.blur();

		await view.rerender( <Trail width={ 480 } /> );

		await waitFor( () => {
			expect(
				screen.queryByRole( 'button', {
					name: /hidden breadcrumb items?/,
				} )
			).not.toBeInTheDocument();
		} );
		expect( screen.getByRole( 'link', { name: 'Section' } ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: 'Archive' } ) ).toBeVisible();
	} );
} );
