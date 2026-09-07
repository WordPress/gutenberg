import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { useInlineFit } from '../components/widget-attributes/use-inline-fit';
import { useDashboardInternalContext } from '../context/dashboard-context';
import { useDashboardUIContext } from '../context/ui-context';
import { WidgetDashboard } from '../widget-dashboard';
import type {
	CanPerformDashboardOperation,
	DashboardInstanceOperation,
	DashboardOperationRequest,
	DashboardWidget,
} from '../types';

jest.mock( '../components/widget-attributes/use-inline-fit', () => ( {
	useInlineFit: jest.fn(),
} ) );

const mockedUseInlineFit = jest.mocked( useInlineFit );

function TestWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< { label?: string } > ) {
	return (
		<>
			<p data-testid="label">{ attributes?.label ?? '' }</p>
			<p data-testid="contract">
				{ setAttributes ? 'editable' : 'read-only' }
			</p>
		</>
	);
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/snapshot',
		title: 'Snapshot',
		renderModule: 'snapshot-module',
		attributes: [
			{ id: 'metric', label: 'Metric', type: 'text', relevance: 'high' },
			{ id: 'label', label: 'Label', type: 'text' },
		],
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const initialLayout: DashboardWidget[] = [
	{
		uuid: 'w1',
		type: 'test/snapshot',
		attributes: { metric: 'views', label: 'Traffic' },
		placement: { width: 1, height: 1 },
	},
];

/* Denies the listed instance operations, allows everything else. */
const deny =
	(
		...operations: DashboardInstanceOperation[]
	): CanPerformDashboardOperation =>
	( request ) =>
		! ( operations as string[] ).includes( request.operation );

/* Composed triggers reaching the engine's state directly. */
function ClearLayout() {
	const { onLayoutChange } = useDashboardInternalContext();
	return (
		<button type="button" onClick={ () => onLayoutChange( [] ) }>
			Clear
		</button>
	);
}

function RemoveInstance( { uuid }: { uuid: string } ) {
	const { layout, onLayoutChange } = useDashboardInternalContext();
	return (
		<button
			type="button"
			onClick={ () =>
				onLayoutChange(
					layout.filter( ( widget ) => widget.uuid !== uuid )
				)
			}
		>
			Remove { uuid }
		</button>
	);
}

function OpenSettings() {
	const { setSettingsWidgetUuid } = useDashboardUIContext();
	return (
		<button type="button" onClick={ () => setSettingsWidgetUuid( 'w1' ) }>
			Open settings
		</button>
	);
}

/* Reaches the engine's staging and commit paths directly. */
interface EngineApi {
	layout: DashboardWidget[];
	mutate: ( next: DashboardWidget[] ) => void;
	commit: () => void;
	scheduleAutoSave: () => void;
}

const engineRef: { current: EngineApi | null } = { current: null };

function EngineProbe() {
	const ctx = useDashboardInternalContext();
	useEffect( () => {
		engineRef.current = {
			layout: ctx.layout,
			mutate: ctx.onLayoutChange,
			commit: ctx.commit,
			scheduleAutoSave: ctx.scheduleAutoSave,
		};
	} );
	return null;
}

function readEngine(): EngineApi {
	if ( ! engineRef.current ) {
		throw new Error( 'EngineProbe not mounted yet' );
	}
	return engineRef.current;
}

interface HarnessProps {
	canPerform?: CanPerformDashboardOperation;
	editMode?: boolean;
	layout?: DashboardWidget[];
	onLayoutChange?: ( next: DashboardWidget[] ) => void;
	children?: React.ReactNode;
}

function Harness( {
	canPerform,
	editMode = false,
	layout: seed = initialLayout,
	onLayoutChange,
	children,
}: HarnessProps ) {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( seed );

	const dashboard = (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				onLayoutChange?.( next );
				setLayout( next );
			} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ () => {} }
			resolveWidgetModule={ resolveWidgetModule }
		>
			<WidgetDashboard.Actions />
			<WidgetDashboard.Widgets />
			{ children }
		</WidgetDashboard>
	);

	return canPerform ? (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			{ dashboard }
		</WidgetDashboard.Policy>
	) : (
		dashboard
	);
}

/* Edit is granted and revoked from application state. */
function RevocableEditHarness() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );
	const [ editable, setEditable ] = useState( true );
	const canPerform = useMemo< CanPerformDashboardOperation >(
		() => ( request ) => request.operation !== 'edit' || editable,
		[ editable ]
	);

	return (
		<>
			<button
				type="button"
				onClick={ () => setEditable( ( value ) => ! value ) }
			>
				Toggle edit
			</button>
			<WidgetDashboard.Policy canPerform={ canPerform }>
				<WidgetDashboard
					layout={ layout }
					onLayoutChange={ setLayout }
					widgetTypes={ widgetTypes }
					onEditChange={ () => {} }
					resolveWidgetModule={ resolveWidgetModule }
				>
					<WidgetDashboard.Actions />
					<WidgetDashboard.Widgets />
				</WidgetDashboard>
			</WidgetDashboard.Policy>
		</>
	);
}

describe( 'WidgetDashboard.Policy instance operations', () => {
	beforeEach( () => {
		mockedUseInlineFit.mockReturnValue( {
			measureRef: () => {},
			collapsed: false,
		} );
	} );

	it( 'asks with the placed widget and its type', async () => {
		const canPerform = jest.fn< boolean, [ unknown ] >( () => true );
		render( <Harness canPerform={ canPerform } editMode /> );
		await screen.findByTestId( 'label' );

		for ( const operation of [ 'remove', 'move', 'resize', 'edit' ] ) {
			expect( canPerform ).toHaveBeenCalledWith( {
				operation,
				widget: initialLayout[ 0 ],
				widgetType: widgetTypes[ 0 ],
			} );
		}
	} );

	it( 'shows both layout controls when the policy allows them', async () => {
		render( <Harness editMode /> );
		await screen.findByTestId( 'label' );

		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Widget options' } )
		).toBeInTheDocument();
	} );

	it( 'hides the Remove control when remove is denied', async () => {
		render( <Harness canPerform={ deny( 'remove' ) } editMode /> );
		await screen.findByTestId( 'label' );

		expect(
			screen.queryByRole( 'button', { name: 'Remove' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Widget options' } )
		).toBeInTheDocument();
	} );

	it( 'hides the width menu when resize is denied', async () => {
		render( <Harness canPerform={ deny( 'resize' ) } editMode /> );
		await screen.findByTestId( 'label' );

		expect(
			screen.queryByRole( 'button', { name: 'Widget options' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toBeInTheDocument();
	} );

	it( 'keeps the tile fixed when move is denied', async () => {
		/* eslint-disable testing-library/no-container, testing-library/no-node-access */
		const { container } = render(
			<Harness canPerform={ deny( 'move' ) } editMode />
		);
		await screen.findByTestId( 'label' );

		const activator = container.querySelector(
			'[aria-roledescription="sortable"]'
		);
		expect( activator ).toHaveAttribute( 'aria-disabled', 'true' );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
	} );

	it( 'treats a non-boolean answer as a denial on every surface', async () => {
		// A host written in JavaScript can leave an operation unanswered.
		const canPerform = ( ( request: DashboardOperationRequest ) =>
			request.operation === 'move'
				? undefined
				: true ) as CanPerformDashboardOperation;
		/* eslint-disable testing-library/no-container, testing-library/no-node-access */
		const { container } = render(
			<Harness canPerform={ canPerform } editMode />
		);
		await screen.findByTestId( 'label' );

		const activator = container.querySelector(
			'[aria-roledescription="sortable"]'
		);
		expect( activator ).toHaveAttribute( 'aria-disabled', 'true' );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
		expect(
			screen.getByRole( 'button', { name: 'Widget options' } )
		).toBeInTheDocument();
	} );

	it( 'renders the widget read-only and without attribute controls when edit is denied', async () => {
		render( <Harness canPerform={ deny( 'edit' ) } /> );

		expect( await screen.findByTestId( 'contract' ) ).toHaveTextContent(
			'read-only'
		);
		expect(
			screen.queryByRole( 'button', { name: 'Widget settings' } )
		).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Metric' ) ).not.toBeInTheDocument();
	} );

	it( 'hands the widget setAttributes when edit is allowed', async () => {
		render( <Harness /> );

		expect( await screen.findByTestId( 'contract' ) ).toHaveTextContent(
			'editable'
		);
		expect(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		).toBeInTheDocument();
	} );

	it( 'does not open the settings surface for an instance whose edit is denied', async () => {
		const user = userEvent.setup();
		render(
			<Harness canPerform={ deny( 'edit' ) }>
				<OpenSettings />
			</Harness>
		);
		await screen.findByTestId( 'label' );

		await user.click(
			screen.getByRole( 'button', { name: 'Open settings' } )
		);

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'discards the settings surface edits when edit is revoked', async () => {
		const user = userEvent.setup();
		render( <RevocableEditHarness /> );
		await screen.findByTestId( 'label' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Snapshot settings',
		} );
		await user.type( within( dialog ).getByLabelText( 'Label' ), '!' );
		expect( screen.getByTestId( 'label' ) ).toHaveTextContent(
			/^Traffic!$/
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle edit' } )
		);

		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
		expect( screen.getByTestId( 'label' ) ).toHaveTextContent(
			/^Traffic$/
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle edit' } )
		);

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'label' ) ).toHaveTextContent(
			/^Traffic$/
		);
	} );

	it( 're-asserts an instance locked against removal in staging', async () => {
		const user = userEvent.setup();
		render(
			<Harness canPerform={ deny( 'remove' ) } editMode>
				<ClearLayout />
			</Harness>
		);
		await screen.findByTestId( 'label' );

		await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );

		expect( screen.getByTestId( 'label' ) ).toHaveTextContent( 'Traffic' );
	} );

	it( 'keeps a re-asserted instance at its place', async () => {
		const user = userEvent.setup();
		const layout: DashboardWidget[] = [
			initialLayout[ 0 ],
			{
				uuid: 'w2',
				type: 'test/snapshot',
				attributes: { metric: 'sales', label: 'Revenue' },
				placement: { width: 1, height: 1 },
			},
		];
		const lockFirst: CanPerformDashboardOperation = ( request ) =>
			! (
				request.operation === 'remove' && request.widget.uuid === 'w1'
			);
		render(
			<Harness canPerform={ lockFirst } layout={ layout } editMode>
				<RemoveInstance uuid="w1" />
			</Harness>
		);
		await screen.findAllByTestId( 'label' );

		await user.click( screen.getByRole( 'button', { name: 'Remove w1' } ) );

		expect(
			screen.getAllByTestId( 'label' ).map( ( node ) => node.textContent )
		).toEqual( [ 'Traffic', 'Revenue' ] );
	} );

	it( 'lets staging drop an instance the policy allows to remove', async () => {
		const user = userEvent.setup();
		render(
			<Harness editMode>
				<ClearLayout />
			</Harness>
		);
		await screen.findByTestId( 'label' );

		await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );

		expect( screen.queryByTestId( 'label' ) ).not.toBeInTheDocument();
	} );

	describe( 'staging enforcement', () => {
		const secondWidget: DashboardWidget = {
			uuid: 'w2',
			type: 'test/snapshot',
			attributes: { metric: 'sales', label: 'Revenue' },
			placement: { width: 1, height: 1 },
		};

		it( 'holds a move-denied instance and publishes nothing on Done', async () => {
			const onLayoutChange = jest.fn();
			const pinFirst: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'w1'
				);
			render(
				<Harness
					canPerform={ pinFirst }
					layout={ [ initialLayout[ 0 ], secondWidget ] }
					onLayoutChange={ onLayoutChange }
					editMode
				>
					<EngineProbe />
				</Harness>
			);
			await screen.findAllByTestId( 'label' );

			act( () => {
				const [ first, second ] = readEngine().layout;
				readEngine().mutate( [ second, first ] );
			} );

			expect(
				screen
					.getAllByTestId( 'label' )
					.map( ( node ) => node.textContent )
			).toEqual( [ 'Traffic', 'Revenue' ] );

			act( () => {
				readEngine().commit();
			} );

			expect( onLayoutChange ).not.toHaveBeenCalled();
		} );

		it( 'publishes only the allowed changes on Done', async () => {
			const onLayoutChange = jest.fn();
			const lockFirstEdit: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'edit' && request.widget.uuid === 'w1'
				);
			render(
				<Harness
					canPerform={ lockFirstEdit }
					layout={ [ initialLayout[ 0 ], secondWidget ] }
					onLayoutChange={ onLayoutChange }
					editMode
				>
					<EngineProbe />
				</Harness>
			);
			await screen.findAllByTestId( 'label' );

			act( () => {
				const [ first, second ] = readEngine().layout;
				readEngine().mutate( [
					{
						...first,
						attributes: { metric: 'views', label: 'Hijacked' },
					},
					{
						...second,
						attributes: { metric: 'sales', label: 'Edited' },
					},
				] );
			} );

			act( () => {
				readEngine().commit();
			} );

			expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
			expect(
				onLayoutChange.mock.calls[ 0 ][ 0 ].map(
					( w: DashboardWidget< { label?: string } > ) =>
						w.attributes?.label
				)
			).toEqual( [ 'Traffic', 'Edited' ] );
		} );

		it( 'publishes nothing through the inline auto-save when every staged change was denied', async () => {
			const onLayoutChange = jest.fn();
			render(
				<Harness
					canPerform={ deny( 'edit' ) }
					onLayoutChange={ onLayoutChange }
				>
					<EngineProbe />
				</Harness>
			);
			await screen.findByTestId( 'label' );

			jest.useFakeTimers();
			try {
				act( () => {
					const [ first ] = readEngine().layout;
					readEngine().mutate( [
						{
							...first,
							attributes: {
								metric: 'views',
								label: 'Hijacked',
							},
						},
					] );
					readEngine().scheduleAutoSave();
				} );

				act( () => {
					jest.runOnlyPendingTimers();
				} );

				expect( onLayoutChange ).not.toHaveBeenCalled();
			} finally {
				jest.useRealTimers();
			}
		} );

		it( 'drops an insertion of a rejected type before it reaches a commit', async () => {
			const onLayoutChange = jest.fn();
			const rejectInserts: CanPerformDashboardOperation = ( request ) =>
				request.operation !== 'insert';
			render(
				<Harness
					canPerform={ rejectInserts }
					onLayoutChange={ onLayoutChange }
					editMode
				>
					<EngineProbe />
				</Harness>
			);
			await screen.findByTestId( 'label' );

			act( () => {
				readEngine().mutate( [
					...readEngine().layout,
					{
						uuid: 'w-new',
						type: 'test/snapshot',
						placement: { width: 1, height: 1 },
					},
				] );
			} );

			expect( screen.getAllByTestId( 'label' ) ).toHaveLength( 1 );

			act( () => {
				readEngine().commit();
			} );

			expect( onLayoutChange ).not.toHaveBeenCalled();
		} );

		it( 're-asserts the spans of a resize-denied instance in staging', async () => {
			const onLayoutChange = jest.fn();
			render(
				<Harness
					canPerform={ deny( 'resize' ) }
					onLayoutChange={ onLayoutChange }
					editMode
				>
					<EngineProbe />
				</Harness>
			);
			await screen.findByTestId( 'label' );

			act( () => {
				const [ first ] = readEngine().layout;
				readEngine().mutate( [
					{ ...first, placement: { width: 4, height: 2 } },
				] );
			} );

			expect( readEngine().layout[ 0 ].placement ).toEqual( {
				width: 1,
				height: 1,
			} );

			act( () => {
				readEngine().commit();
			} );

			expect( onLayoutChange ).not.toHaveBeenCalled();
		} );
	} );
} );
