import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import type { useDispatch, useSelect } from '@wordpress/data';
import ChildLayoutControl from '../';
import type {
	ChildLayout,
	ChildLayoutControlProps,
	ParentLayout,
} from '../types';
import type { BlockStyleState } from '../../../hooks/types';
import { lock } from '../../../lock-unlock';

// What the mocked block editor store returns, which tests can change.
const mockStore = vi.hoisted(
	(): {
		attributes: Record< string, Record< string, unknown > >;
		selectedState: BlockStyleState | undefined;
	} => ( {
		attributes: {},
		selectedState: undefined,
	} )
);

globalThis.wpVitest.mockMatchMedia();

globalThis.wpVitest.mockResizeObserver();

vi.mock( import( '../../use-settings' ), () => ( {
	useSettings: () => [ undefined ],
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The hook's type carries more than the mock function.
	useSelect: vi.fn(
		( mapSelect: ( ( select: unknown ) => unknown ) | object ) => {
			if ( typeof mapSelect === 'function' ) {
				const selectors = {
					getBlockRootClientId: () => 'root-client-id',
					getBlockAttributes: ( clientId: string ) =>
						mockStore.attributes[ clientId ] ?? {},
					getBlockOrder: () => [],
					getBlocksByClientId: () => [],
					getSelectedBlockStyleState: () => mockStore.selectedState,
				};
				// The grid isn't stacked on mobile.
				lock( selectors, { getStackedGridLayouts: () => null } );
				return mapSelect( () => selectors );
			}

			return {
				getBlockAttributes: () => ( {} ),
				getBlockOrder: () => [],
			};
		}
	) as unknown as typeof useSelect,
	// Only the actions the control dispatches.
	useDispatch: ( () => ( {
		__unstableMarkNextChangeAsNotPersistent: vi.fn(),
		moveBlocksToPosition: vi.fn(),
	} ) ) as unknown as typeof useDispatch,
} ) );

describe( 'ChildLayoutControl', () => {
	const baseProps = {
		onChange: vi.fn(),
		parentLayout: {
			type: 'grid',
		},
		isShownByDefault: true,
		panelId: 'client-id',
	};

	afterEach( () => {
		vi.clearAllMocks();
	} );

	function renderControl( props: Partial< ChildLayoutControlProps > ) {
		return render(
			<ToolsPanel
				label="Dimensions"
				resetAll={ vi.fn() }
				panelId="client-id"
			>
				<ChildLayoutControl { ...baseProps } { ...props } />
			</ToolsPanel>
		);
	}

	it( 'shows default grid span values for unset span controls by default', () => {
		renderControl( { value: {} } );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( 1 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( 1 );
	} );

	it( 'shows empty grid span values when defaults are hidden', () => {
		renderControl( { value: {}, showGridSpanDefaults: false } );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( null );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( null );
	} );

	it( 'shows explicitly set grid span values when defaults are hidden', () => {
		renderControl( {
			value: {
				columnSpan: 1,
				rowSpan: 2,
			},
			showGridSpanDefaults: false,
		} );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( 1 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( 2 );
	} );

	it( 'sets a numeric span when entering 1 into an empty span control', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		renderControl( {
			value: {},
			onChange,
			showGridSpanDefaults: false,
		} );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Column span' } ),
			'1'
		);

		expect( onChange ).toHaveBeenCalledWith( {
			columnStart: undefined,
			rowStart: undefined,
			rowSpan: undefined,
			columnSpan: 1,
		} );
	} );

	describe( 'free box in manual grids', () => {
		const box = { left: 0.1, top: 0.2, width: 0.5, height: 0.6 };
		const value: ChildLayout = {
			columnStart: 2,
			rowStart: 1,
			columnSpan: 2,
			rowSpan: 1,
			box,
		};
		const parentLayout: ParentLayout = {
			type: 'grid',
			isManualPlacement: true,
			columnCount: 4,
			rowCount: 4,
		};

		let originalExperiment: boolean | undefined;
		beforeEach( () => {
			originalExperiment = window.__experimentalEnableGridInteractivity;
			window.__experimentalEnableGridInteractivity = true;
		} );
		afterEach( () => {
			window.__experimentalEnableGridInteractivity = originalExperiment;
			mockStore.attributes = {};
			mockStore.selectedState = undefined;
		} );

		it( 'changing a start on mobile keeps the box of the default place', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			// The block has a free place in the default state only, and the
			// control shows its mobile layout, which is empty.
			mockStore.attributes = {
				'client-id': { style: { layout: value } },
			};
			mockStore.selectedState = {
				viewport: '@mobile',
				pseudo: 'default',
			};
			renderControl( { value: {}, onChange, parentLayout } );

			// The mobile layout has no place yet, so the control is shown
			// from the panel's menu.
			await user.click(
				screen.getByRole( 'button', { name: 'Dimensions options' } )
			);
			await user.click(
				screen.getByRole( 'menuitemcheckbox', {
					name: /Grid placement/,
				} )
			);
			const input = screen.getByRole( 'spinbutton', { name: 'Column' } );
			await user.clear( input );
			await user.type( input, '3' );

			expect( onChange.mock.calls.at( -1 )![ 0 ].box ).toEqual( box );
		} );

		it( 'changing a span clears the box', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			renderControl( { value, onChange, parentLayout } );

			const input = screen.getByRole( 'spinbutton', {
				name: 'Column span',
			} );
			await user.clear( input );
			await user.type( input, '1' );

			const change = onChange.mock.calls.at( -1 )![ 0 ];
			expect( change.columnSpan ).toBe( 1 );
			expect( Object.hasOwn( change, 'box' ) ).toBe( true );
			expect( change.box ).toBeUndefined();
		} );

		it( 'changing a start keeps the box', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			renderControl( { value, onChange, parentLayout } );

			const input = screen.getByRole( 'spinbutton', { name: 'Column' } );
			await user.clear( input );
			await user.type( input, '1' );

			expect( onChange.mock.calls.at( -1 )![ 0 ] ).toEqual( {
				columnStart: 1,
				rowStart: 1,
				columnSpan: 2,
				rowSpan: 1,
				box,
			} );
		} );
	} );

	it( 'shows legacy fixed flex sizing as max', async () => {
		renderControl( {
			parentLayout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			value: {
				selfStretch: 'fixed',
				flexSize: '320px',
			},
		} );

		expect(
			await screen.findByRole( 'radio', { name: 'Max' } )
		).toBeChecked();
	} );

	it( 'sets fixedNoShrink when selecting fixed flex sizing', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		renderControl( {
			parentLayout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			value: {},
			onChange,
		} );

		await user.click( screen.getByRole( 'radio', { name: 'Fixed' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			selfStretch: 'fixedNoShrink',
			flexSize: undefined,
		} );
	} );

	it( 'sets legacy fixed when selecting max sizing', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		renderControl( {
			parentLayout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			value: {
				selfStretch: 'fixedNoShrink',
				flexSize: '320px',
			},
			onChange,
		} );

		await user.click( screen.getByRole( 'radio', { name: 'Max' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			selfStretch: 'fixed',
			flexSize: '320px',
		} );
	} );
} );
