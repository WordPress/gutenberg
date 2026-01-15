/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { createRef } from 'react';

/**
 * Internal dependencies
 */
import * as Tabs from '../index';

describe( 'Tabs', () => {
	it( 'forwards ref', () => {
		const rootRef = createRef< HTMLDivElement >();
		const listRef = createRef< HTMLDivElement >();
		const tabRef = createRef< HTMLButtonElement >();
		const panelRef = createRef< HTMLDivElement >();

		render(
			<Tabs.Root ref={ rootRef } defaultValue="tab1">
				<Tabs.List ref={ listRef }>
					<Tabs.Tab ref={ tabRef } value="tab1">
						Tab 1
					</Tabs.Tab>
					<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel ref={ panelRef } value="tab1">
					Panel 1 content
				</Tabs.Panel>
				<Tabs.Panel value="tab2">Panel 2 content</Tabs.Panel>
			</Tabs.Root>
		);

		expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( listRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( tabRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( panelRef.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
