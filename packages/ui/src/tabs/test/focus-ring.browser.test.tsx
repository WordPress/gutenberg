import { expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { Children } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { Tabs } from '../..';

it( 'keeps the focus ring aligned on a custom-height minimal tab under theme SVG styles', async () => {
	await render(
		<>
			<style>
				{
					'svg { display: block; height: auto; max-width: 100%; } svg:not(:root) { overflow: hidden; }'
				}
			</style>
			<Tabs.Root defaultValue="one">
				<Tabs.List variant="minimal">
					<Tabs.Tab
						value="one"
						style={ { height: 64 } }
						render={ ( props ) => (
							<button { ...props }>
								{ Children.only( props.children ) }
							</button>
						) }
					>
						One
					</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="one">First panel</Tabs.Panel>
			</Tabs.Root>
		</>
	);

	const tab = page.getByRole( 'tab', { name: 'One' } ).element();
	const ring = tab.querySelector( 'svg' )!;
	expect( ring ).not.toBeVisible();

	await userEvent.tab();
	expect( tab ).toHaveFocus();
	expect( ring ).toBeVisible();
	expect( getComputedStyle( ring ).overflow ).toBe( 'visible' );

	const tabBox = tab.getBoundingClientRect();
	const ringBox = ring.getBoundingClientRect();
	expect( ringBox.top - tabBox.top ).toBe( 8 );
	expect( tabBox.bottom - ringBox.bottom ).toBe( 8 );
} );
