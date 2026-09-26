import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import TypographyPanel from '../typography-panel';

/*
 * Style, Weight and Width are one panel item each, so each has its own default
 * visibility, its own value, its own reset and its own inheritance treatment.
 * These tests pin the seams that splitting them introduces.
 */

// The inheritance treatment is behind an experiment. Turn it on where the test
// is about that treatment, and leave it unset elsewhere, since an experiment
// that was never turned on leaves the global `undefined`.
beforeEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

const ALL_AXES = {
	typography: {
		fontStyle: true,
		fontWeight: true,
		fontStretch: true,
	},
};

async function renderPanel( props ) {
	return await render(
		<TypographyPanel
			value={ {} }
			settings={ ALL_AXES }
			onChange={ vi.fn() }
			panelId="test-panel"
			{ ...props }
		/>
	);
}

// A panel item has no role of its own, so it is reached through its control.
const getControl = ( name ) => {
	for ( const role of [ 'button', 'combobox', 'spinbutton' ] ) {
		const found = screen.queryByRole( role, { name } );
		if ( found ) {
			return found;
		}
	}
	return null;
};

const getItem = ( name ) => {
	const control = getControl( name );
	// eslint-disable-next-line testing-library/no-node-access
	return control?.closest( '.components-tools-panel-item' ) ?? null;
};

const openMenu = async () => {
	const toggle = screen.getByRole( 'button', {
		name: /typography options/i,
	} );
	toggle.click();
	await screen.findByRole( 'menu' );
	// An item shown by default offers a plain menu item, not a checkbox.
	return [
		...screen.queryAllByRole( 'menuitemcheckbox' ),
		...screen.queryAllByRole( 'menuitem' ),
	];
};

const menuNames = async () =>
	( await openMenu() ).map( ( item ) => item.textContent.trim() );

describe( 'Typography axes as separate panel items', () => {
	it( 'offers a menu item per axis the settings allow', async () => {
		await renderPanel();

		const names = await menuNames();
		expect( names ).toEqual(
			expect.arrayContaining( [ 'Style', 'Weight', 'Width' ] )
		);
		expect( names ).not.toContain( 'Appearance' );
	} );

	it( 'leaves out the axes the settings turn off', async () => {
		await renderPanel( {
			settings: { typography: { fontWeight: true } },
		} );

		const names = await menuNames();
		expect( names ).toContain( 'Weight' );
		expect( names ).not.toContain( 'Style' );
		expect( names ).not.toContain( 'Width' );
	} );

	it( 'resets one axis without touching the others', async () => {
		// The reset button each item carries when a local value shadows an
		// inherited one. Reaching it through the item is the point: the reset
		// belongs to that axis and to nothing else.
		window.__experimentalGlobalStylesInheritanceUI = true;
		const onChange = vi.fn();
		await renderPanel( {
			value: {
				typography: {
					fontStyle: 'italic',
					fontWeight: '700',
					fontStretch: 'condensed',
				},
			},
			inheritedValue: {
				typography: {
					fontStyle: 'normal',
					fontWeight: '400',
					fontStretch: 'normal',
				},
			},
			defaultControls: {
				fontStyle: true,
				fontWeight: true,
				fontStretch: true,
			},
			onChange,
		} );

		const weightItem = getItem( /^weight$/i );
		await userEvent.click(
			within( weightItem ).getByRole( 'button', {
				name: /reset to inherited value/i,
			} )
		);

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange.mock.calls[ 0 ][ 0 ].typography ).toEqual(
			expect.objectContaining( {
				fontStyle: 'italic',
				fontWeight: undefined,
				fontStretch: 'condensed',
			} )
		);
	} );
} );

describe( 'defaultControls.fontAppearance as an alias', () => {
	it( 'shows Style and Weight by default, and leaves Width in the menu', async () => {
		await renderPanel( {
			defaultControls: { fontAppearance: true },
		} );

		expect( getItem( /^style$/i ) ).toBeInTheDocument();
		expect( getItem( /^weight$/i ) ).toBeInTheDocument();
		expect( getControl( /^width$/i ) ).not.toBeInTheDocument();
	} );

	it( 'lets a per-axis default override the alias', async () => {
		await renderPanel( {
			defaultControls: {
				fontAppearance: true,
				fontWeight: false,
				fontStretch: true,
			},
		} );

		expect( getItem( /^style$/i ) ).toBeInTheDocument();
		expect( getItem( /^width$/i ) ).toBeInTheDocument();
		expect( getControl( /^weight$/i ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Inheritance is read per axis', () => {
	beforeEach( () => {
		window.__experimentalGlobalStylesInheritanceUI = true;
	} );

	const cases = [
		[ 'style only', { fontStyle: 'italic' }, [ 'style' ] ],
		[ 'weight only', { fontWeight: '700' }, [ 'weight' ] ],
		[ 'width only', { fontStretch: 'condensed' }, [ 'width' ] ],
		[
			'all three',
			{
				fontStyle: 'italic',
				fontWeight: '700',
				fontStretch: 'condensed',
			},
			[ 'style', 'weight', 'width' ],
		],
	];

	it.each( cases )(
		'marks only the inherited axes when %s is inherited',
		async ( _name, typography, inherited ) => {
			await renderPanel( {
				value: {},
				inheritedValue: { typography },
				defaultControls: {
					fontStyle: true,
					fontWeight: true,
					fontStretch: true,
				},
			} );

			for ( const axis of [ 'style', 'weight', 'width' ] ) {
				const item = getItem( new RegExp( `^${ axis }$`, 'i' ) );
				if ( inherited.includes( axis ) ) {
					expect( item ).toHaveClass(
						'is-inherited-from-global-styles'
					);
				} else {
					expect( item ).not.toHaveClass(
						'is-inherited-from-global-styles'
					);
				}
			}
		}
	);
} );
