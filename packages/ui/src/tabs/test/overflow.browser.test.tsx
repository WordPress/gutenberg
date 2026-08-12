import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Tabs } from '../..';
import styles from '../style.module.css';

function OverflowTabs( { tabWidth }: { tabWidth: number } ) {
	return (
		<Tabs.Root defaultValue="one">
			<Tabs.List style={ { width: 173 } }>
				<Tabs.Tab value="one">
					<span
						style={ {
							display: 'inline-block',
							width: tabWidth,
						} }
					>
						One
					</span>
				</Tabs.Tab>
				<Tabs.Tab value="two">
					<span
						style={ {
							display: 'inline-block',
							width: tabWidth,
						} }
					>
						Two
					</span>
				</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="one">One panel</Tabs.Panel>
			<Tabs.Panel value="two">Two panel</Tabs.Panel>
		</Tabs.Root>
	);
}

describe( 'Tabs.List overflow fade', () => {
	it( 'clears the fade when a tab reflows to fit', async () => {
		const view = render( <OverflowTabs tabWidth={ 100 } /> );
		const tablist = screen.getByRole( 'tablist' );

		await waitFor( () => {
			expect( tablist ).toHaveClass( styles[ 'is-overflowing-last' ] );
		} );

		view.rerender( <OverflowTabs tabWidth={ 10 } /> );

		await waitFor( () => {
			expect( tablist ).not.toHaveClass(
				styles[ 'is-overflowing-last' ]
			);
		} );
	} );
} );
