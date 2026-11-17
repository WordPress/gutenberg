import {
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSettings } from '@wordpress/block-editor';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

// The real `getViewportMediaQueries` decides which breakpoints are valid.
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	useSettings: vi.fn(),
} ) );

const DEFAULT_VIEWPORT_SETTINGS = { mobile: '480px', tablet: '782px' };

const setAttributes = vi.fn();

// Loaded in `beforeAll`, since the build project only lists TypeScript files.
let OverlayVisibilityControl: ComponentType< {
	overlayMenu: string;
	setAttributes: ( attributes: { overlayMenu: string } ) => void;
} >;

function renderControl( overlayMenu: string ) {
	render(
		<OverlayVisibilityControl
			overlayMenu={ overlayMenu }
			setAttributes={ setAttributes }
		/>
	);
}

async function getOptionLabels() {
	const options = await screen.findAllByRole( 'radio' );
	return options.map( ( option ) => option.textContent );
}

describe( 'OverlayVisibilityControl', () => {
	beforeAll( async () => {
		const { default: Control } = await vi.importActual< {
			default: typeof OverlayVisibilityControl;
		} >( '../overlay-visibility-control' );
		OverlayVisibilityControl = Control;
	} );

	beforeEach( () => {
		vi.clearAllMocks();
		( useSettings as Mock ).mockReturnValue( [
			DEFAULT_VIEWPORT_SETTINGS,
		] );
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

	it( 'shows Tablet when the theme sets no viewport breakpoints', async () => {
		( useSettings as Mock ).mockReturnValue( [ undefined ] );

		renderControl( 'mobile' );

		expect(
			await screen.findByRole( 'radio', { name: 'Tablet' } )
		).toBeInTheDocument();
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
		( useSettings as Mock ).mockReturnValue( [
			{ mobile: '480px', tablet: 'invalid' },
		] );

		renderControl( 'mobile' );

		expect( await getOptionLabels() ).toEqual( [
			'Off',
			'Mobile',
			'Always',
		] );
	} );

	it( 'shows Tablet, selected, when it is already set and the theme has no tablet breakpoint', async () => {
		( useSettings as Mock ).mockReturnValue( [
			{ mobile: '480px', tablet: 'invalid' },
		] );

		renderControl( 'tablet' );

		expect(
			await screen.findByRole( 'radio', { name: 'Tablet' } )
		).toBeChecked();
	} );
} );
