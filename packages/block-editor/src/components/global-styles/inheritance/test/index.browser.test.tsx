import type { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../../../lock-unlock';
import { getInheritanceProps, InheritanceToolsPanelItem } from '../';

const { ToolsPanel } = unlock( componentsPrivateApis );

describe( 'getInheritanceProps', () => {
	test( 'is not inherited when neither flag is set', () => {
		expect( getInheritanceProps( false, false ) ).toEqual( {
			isInherited: false,
		} );
	} );

	test( 'is inherited at rest', () => {
		expect( getInheritanceProps( true, false ) ).toEqual( {
			isInherited: true,
		} );
	} );

	test( 'stays inherited while a local value overrides the inherited one', () => {
		expect( getInheritanceProps( false, true ) ).toEqual( {
			isInherited: true,
		} );
	} );

	test( 'coerces truthy and falsy non-boolean inputs', () => {
		expect( getInheritanceProps( 1, 0 ).isInherited ).toBe( true );
		expect( getInheritanceProps( '', undefined ).isInherited ).toBe(
			false
		);
	} );

	test( 'passes the base className through', () => {
		expect( getInheritanceProps( true, false, 'single-column' ) ).toEqual( {
			className: 'single-column',
			isInherited: true,
		} );
	} );
} );

type ItemConfig = Partial<
	ComponentProps< typeof InheritanceToolsPanelItem >
> & {
	label: string;
};

async function renderPanel( items: ItemConfig[] ) {
	return await render(
		<ToolsPanel label="Typography" resetAll={ () => {} } inheritanceMode>
			{ items.map( ( { label, ...props } ) => (
				<InheritanceToolsPanelItem
					key={ label }
					label={ label }
					hasValue={ () => false }
					{ ...props }
				>
					<p>{ `${ label } control` }</p>
				</InheritanceToolsPanelItem>
			) ) }
		</ToolsPanel>
	);
}

describe( 'InheritanceToolsPanelItem in an inheritance mode panel', () => {
	test( 'shows a control only while it holds a local or inherited value', async () => {
		await renderPanel( [
			{ label: 'Line height', isInherited: true },
			{ label: 'Font size', hasValue: () => true },
			{ label: 'Letter spacing', isShownByDefault: true },
		] );

		expect( screen.getByText( 'Line height control' ) ).toBeVisible();
		expect( screen.getByText( 'Font size control' ) ).toBeVisible();
		expect(
			screen.queryByText( 'Letter spacing control' )
		).not.toBeInTheDocument();
	} );

	test( 'leaves an inherited control out of the panel menu', async () => {
		await renderPanel( [
			{ label: 'Line height', isInherited: true },
			{ label: 'Letter spacing' },
		] );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Typography controls' } )
		);

		expect(
			screen.queryByRole( 'menuitemcheckbox', { name: /^Line height/ } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Letter spacing, show',
			} )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Reset all' } )
		).not.toBeInTheDocument();
	} );

	test( 'offers no reset menu while no control holds a local value', async () => {
		await renderPanel( [ { label: 'Line height', isInherited: true } ] );

		expect(
			screen.queryByRole( 'button', {
				name: 'Reset Typography',
			} )
		).not.toBeInTheDocument();
	} );

	test( 'resets a single control from the reset menu', async () => {
		const onDeselect = vi.fn();
		await renderPanel( [
			{
				label: 'Line height',
				isInherited: true,
				hasValue: () => true,
				onDeselect,
			},
			{ label: 'Letter spacing', isInherited: true },
		] );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Reset Typography' } )
		);
		expect(
			screen.queryByRole( 'menuitem', { name: 'Letter spacing' } )
		).not.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole( 'menuitem', { name: 'Line height' } )
		);

		expect( onDeselect ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'renders no reset dot for a local override', async () => {
		await renderPanel( [
			{ label: 'Line height', isInherited: true, hasValue: () => true },
		] );

		expect(
			screen.queryByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).not.toBeInTheDocument();
	} );
} );
