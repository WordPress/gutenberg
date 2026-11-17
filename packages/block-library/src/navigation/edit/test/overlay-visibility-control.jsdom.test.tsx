import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const setAttributes = vi.fn();

// Loaded in `beforeAll`, since the build project only lists TypeScript files.
let OverlayVisibilityControl: ComponentType< {
	overlayMenu: string;
	setAttributes: ( attributes: { overlayMenu: string } ) => void;
	hasTabletViewport: boolean;
} >;

/**
 * Renders the control with its value held in state, as the block does.
 *
 * @param props                   Props.
 * @param props.initialValue      Initial `overlayMenu` value.
 * @param props.hasTabletViewport Whether the theme has a tablet breakpoint.
 */
function ControlledControl( {
	initialValue,
	hasTabletViewport,
}: {
	initialValue: string;
	hasTabletViewport: boolean;
} ) {
	const [ overlayMenu, setOverlayMenu ] = useState( initialValue );
	return (
		<OverlayVisibilityControl
			overlayMenu={ overlayMenu }
			setAttributes={ ( attributes ) => {
				setAttributes( attributes );
				setOverlayMenu( attributes.overlayMenu );
			} }
			hasTabletViewport={ hasTabletViewport }
		/>
	);
}

function renderControl( initialValue: string, hasTabletViewport = true ) {
	render(
		<ControlledControl
			initialValue={ initialValue }
			hasTabletViewport={ hasTabletViewport }
		/>
	);
}

async function getOptionLabels() {
	const options = await screen.findAllByRole( 'radio' );
	return options.map( ( option ) => option.textContent );
}

describe( 'OverlayVisibilityControl', () => {
	// Loading the component and its dependencies can take several seconds.
	beforeAll( async () => {
		const { default: Control } = await vi.importActual< {
			default: typeof OverlayVisibilityControl;
		} >( '../overlay-visibility-control' );
		OverlayVisibilityControl = Control;
	}, 30000 );

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'shows Off, Mobile, Tablet and Always, in that order', async () => {
		renderControl( 'mobile' );

		expect( await getOptionLabels() ).toEqual( [
			'Off',
			'Mobile',
			'Tablet',
			'Always',
		] );
	} );

	it( 'sets the overlay menu to tablet when Tablet is selected', async () => {
		const user = userEvent.setup();
		renderControl( 'mobile' );

		await user.click(
			await screen.findByRole( 'radio', { name: 'Tablet' } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( {
			overlayMenu: 'tablet',
		} );
	} );

	it( 'hides Tablet when the theme has no tablet breakpoint', async () => {
		renderControl( 'mobile', false );

		expect( await getOptionLabels() ).toEqual( [
			'Off',
			'Mobile',
			'Always',
		] );
	} );

	it( 'shows Tablet, selected, when it is already set and the theme has no tablet breakpoint', async () => {
		renderControl( 'tablet', false );

		expect(
			await screen.findByRole( 'radio', { name: 'Tablet' } )
		).toBeChecked();
	} );

	it( 'keeps a saved Tablet option after another option is selected', async () => {
		const user = userEvent.setup();
		renderControl( 'tablet', false );

		await user.click(
			await screen.findByRole( 'radio', { name: 'Mobile' } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( {
			overlayMenu: 'mobile',
		} );
		expect( screen.getByRole( 'radio', { name: 'Mobile' } ) ).toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'Tablet' } )
		).toBeInTheDocument();
	} );
} );
