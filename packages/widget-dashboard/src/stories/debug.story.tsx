import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/components/build-style/style.css';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/dataviews/build-style/style.css';
import { Button } from '@wordpress/components';
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';
import { lockOutline } from '@wordpress/icons';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../context/dashboard-context';
import { useWidgetContext } from '../context/widget-context';
import { WidgetDashboard } from '../widget-dashboard';
import type {
	CanPerformDashboardOperation,
	DashboardInstanceOperation,
	DashboardWidget,
} from '../types';

/*
 * Debug fixture: the rogue triggers write to staging through the internal
 * context, which is what only a composed trigger can do. Not a consumer
 * example. Every tile is a lock card showing its live canonical position
 * and one chip per instance operation; the story controls edit each
 * card's denied operations. Customize mode shows the same locks on the
 * chrome.
 */

const INSTANCE_OPERATIONS: DashboardInstanceOperation[] = [
	'move',
	'resize',
	'remove',
	'edit',
];

type TileLocks = Record< string, DashboardInstanceOperation[] | undefined >;

/* Demo plumbing so the cards re-render when the controls change. */
const TileLocksContext = createContext< TileLocks >( {} );

/* Stable instance name from the uuid: `card-alpha` reads as `Alpha`. */
const cardName = ( uuid: string ) => {
	const raw = uuid.replace( /^card-/, '' ).replace( /-/g, ' ' );
	return raw.charAt( 0 ).toUpperCase() + raw.slice( 1 );
};

/*
 * Reads the demo's lock map by its own uuid purely to visualize it; real
 * widgets never see the policy.
 */
function LockCardWidget( {
	attributes,
}: WidgetRenderProps< { label?: string } > ) {
	const { label = 'Card' } = attributes ?? {};
	const widget = useWidgetContext();
	const locks = useContext( TileLocksContext )[ widget?.uuid ?? '' ] ?? [];

	return (
		<div
			style={ {
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-xs)',
				alignContent: 'center',
				height: '100%',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			<strong
				style={ {
					fontSize: 'var(--wpds-typography-font-size-2xl)',
				} }
			>
				{ `#${ ( widget?.index ?? 0 ) + 1 } · ${ cardName(
					widget?.uuid ?? ''
				) }` }
			</strong>
			<span
				style={ {
					color: 'var(--wpds-color-foreground-content-neutral-weak)',
					fontSize: 'var(--wpds-typography-font-size-sm)',
				} }
			>
				{ `Label: ${ label }` }
			</span>
			<div
				style={ {
					display: 'flex',
					flexWrap: 'wrap',
					gap: 'var(--wpds-dimension-gap-xs)',
					fontSize: 'var(--wpds-typography-font-size-xs)',
					fontWeight: 'var(--wpds-typography-font-weight-emphasis)',
					textTransform: 'uppercase',
				} }
			>
				{ INSTANCE_OPERATIONS.map( ( operation ) => {
					const denied = locks.includes( operation );
					return (
						<span
							key={ operation }
							style={ {
								backgroundColor: denied
									? 'var(--wpds-color-background-surface-error-weak)'
									: 'var(--wpds-color-background-surface-success-weak)',
								borderRadius: 'var(--wpds-border-radius-sm)',
								color: denied
									? 'var(--wpds-color-foreground-content-error)'
									: 'var(--wpds-color-foreground-content-success)',
								paddingInline:
									'var(--wpds-dimension-padding-xs)',
							} }
						>
							{ `${ denied ? '✕' : '✓' } ${ operation }` }
						</span>
					);
				} ) }
			</div>
		</div>
	);
}

const lockCardWidgetType: WidgetType = {
	apiVersion: 1,
	name: 'demo/lock-card',
	title: 'Lock Card',
	description:
		'Shows its canonical position and which operations the policy allows on it.',
	icon: lockOutline,
	renderModule: 'demo/widgets/lock-card/render',
	attributes: [
		{ id: 'label', label: 'Label', type: 'text', relevance: 'high' },
	] as WidgetType[ 'attributes' ],
	example: {
		attributes: { label: 'Example' },
	},
};

/*
 * Registered so insert has a type to reject. The rogue trigger that
 * tries it never lands, so the type does not need a render module.
 */
const rejectedWidgetType: WidgetType = {
	apiVersion: 1,
	name: 'demo/goal-progress',
	title: 'Goal Progress',
	renderModule: 'demo/widgets/goal-progress/render',
};

const resolveDebugModule: ResolveWidgetModule = async () => ( {
	default: LockCardWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const ENFORCEMENT_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'card-alpha',
		type: 'demo/lock-card',
		attributes: { label: 'Alpha' },
		placement: { width: 1, height: 1 },
	},
	{
		uuid: 'card-bravo',
		type: 'demo/lock-card',
		attributes: { label: 'Bravo' },
		placement: { width: 2, height: 1 },
	},
	{
		uuid: 'card-charlie',
		type: 'demo/lock-card',
		attributes: { label: 'Charlie' },
		placement: { width: 1, height: 1 },
	},
	{
		uuid: 'card-delta',
		type: 'demo/lock-card',
		attributes: { label: 'Delta' },
		placement: { width: 1, height: 1 },
	},
];

let stagedInstances = 0;

function RogueTriggers() {
	const { layout, onLayoutChange } = useDashboardInternalContext();

	const insert = ( widget: Omit< DashboardWidget, 'uuid' > ) => {
		stagedInstances += 1;
		onLayoutChange( [
			...layout,
			{ ...widget, uuid: `staged-${ stagedInstances }` },
		] );
	};

	return (
		<div
			style={ {
				display: 'flex',
				flexWrap: 'wrap',
				gap: 'var(--wpds-dimension-gap-xs)',
			} }
		>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () => onLayoutChange( [ ...layout ].reverse() ) }
			>
				Reverse the order
			</Button>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () =>
					onLayoutChange(
						layout.filter(
							( widget ) => widget.uuid !== 'card-delta'
						)
					)
				}
			>
				Remove the Delta card
			</Button>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () =>
					onLayoutChange(
						layout.map( ( widget ) => ( {
							...widget,
							placement: { ...widget.placement, width: 4 },
						} ) )
					)
				}
			>
				Set every width to 4
			</Button>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () =>
					onLayoutChange(
						layout.map( ( widget ) => ( {
							...widget,
							attributes: {
								...( widget.attributes as Record<
									string,
									unknown
								> ),
								label: 'Hijacked',
							},
						} ) )
					)
				}
			>
				Rename every label
			</Button>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () =>
					insert( {
						type: rejectedWidgetType.name,
						attributes: { metric: 'orders', target: '1000' },
						placement: { width: 1, height: 1 },
					} )
				}
			>
				Insert a goal (rejected)
			</Button>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () =>
					insert( {
						type: 'demo/lock-card',
						attributes: { label: 'Staged' },
						placement: { width: 1, height: 1 },
					} )
				}
			>
				Insert a card (allowed)
			</Button>
			<Button
				variant="secondary"
				size="compact"
				onClick={ () => onLayoutChange( ENFORCEMENT_LAYOUT ) }
			>
				Stage the initial layout
			</Button>
		</div>
	);
}

interface StagingEnforcementArgs {
	alpha?: DashboardInstanceOperation[];
	bravo?: DashboardInstanceOperation[];
	charlie?: DashboardInstanceOperation[];
	delta?: DashboardInstanceOperation[];
}

function StagingEnforcementStory( {
	alpha = [],
	bravo = [],
	charlie = [],
	delta = [],
}: StagingEnforcementArgs ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( ENFORCEMENT_LAYOUT );
	const [ editMode, setEditMode ] = useState( false );

	const tileLocks = useMemo< TileLocks >(
		() => ( {
			'card-alpha': alpha,
			'card-bravo': bravo,
			'card-charlie': charlie,
			'card-delta': delta,
		} ),
		[ alpha, bravo, charlie, delta ]
	);

	// Inserting Goal Progress is rejected; instance operations follow
	// the per-card locks from the story controls.
	const canPerform = useMemo< CanPerformDashboardOperation >(
		() => ( request ) => {
			if ( request.operation === 'insert' ) {
				return request.widgetType.name !== rejectedWidgetType.name;
			}
			if ( ! ( 'widget' in request ) ) {
				return true;
			}
			return ! tileLocks[ request.widget.uuid ]?.includes(
				request.operation
			);
		},
		[ tileLocks ]
	);

	return (
		<TileLocksContext.Provider value={ tileLocks }>
			<WidgetDashboard.Policy canPerform={ canPerform }>
				<WidgetDashboard
					widgetTypes={ [ lockCardWidgetType, rejectedWidgetType ] }
					layout={ layout }
					onLayoutChange={ setLayout }
					editMode={ editMode }
					onEditChange={ setEditMode }
					resolveWidgetModule={ resolveDebugModule }
					gridSettings={ { model: 'grid', rowHeight: 200 } }
				>
					<div
						style={ {
							display: 'flex',
							flexWrap: 'wrap',
							alignItems: 'flex-start',
							justifyContent: 'space-between',
							gap: 'var(--wpds-dimension-gap-md)',
							marginBlockEnd: 'var(--wpds-dimension-gap-md)',
						} }
					>
						<RogueTriggers />
						<WidgetDashboard.Actions />
					</div>
					<WidgetDashboard.Widgets />
				</WidgetDashboard>
			</WidgetDashboard.Policy>
		</TileLocksContext.Provider>
	);
}

const meta: Meta< typeof WidgetDashboard > = {
	title: 'Widget Dashboard/Playground/Debug',
	component: WidgetDashboard,
	tags: [ 'status-experimental' ],
	parameters: {
		// FIXME: Sortable widget chrome nests interactive controls (nested-interactive).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
};

export default meta;

const lockControl = {
	control: 'check' as const,
	options: INSTANCE_OPERATIONS,
};

export const StagingEnforcement: StoryObj< StagingEnforcementArgs > = {
	render: ( args ) => <StagingEnforcementStory { ...args } />,
	args: {
		alpha: [],
		bravo: [ 'move' ],
		charlie: [ 'resize' ],
		delta: [ 'remove', 'edit' ],
	},
	argTypes: {
		alpha: {
			...lockControl,
			description: 'Operations denied on the Alpha card.',
		},
		bravo: {
			...lockControl,
			description: 'Operations denied on the Bravo card.',
		},
		charlie: {
			...lockControl,
			description: 'Operations denied on the Charlie card.',
		},
		delta: {
			...lockControl,
			description: 'Operations denied on the Delta card.',
		},
	},
	parameters: {
		docs: {
			description: {
				story: `
Debug fixture. Every tile is a **Lock Card**: it shows its live position in the canonical order and one chip per instance operation, ✓ when the policy allows it and ✕ when it denies it. The controls edit each card's denied operations; by default Bravo cannot move, Charlie cannot resize, Delta cannot be removed or edited, and Alpha is free. Enter Customize to see the same locks on the chrome: a move-denied card refuses to drag and holds its position while the others reorder around it, a resize-denied card offers no resize handle or width menu, a remove-denied card has no Remove control, and the inserter rejects Goal Progress.

The buttons bypass the chrome and write to the engine's staging directly, which is what the staging enforcement exists for: with the default locks, reversing holds Bravo in place, the width sweep skips Charlie, the rename skips Delta, and removing Delta re-asserts it, while the rejected insertion never lands and the allowed one does. Relax a lock from the controls and the same trigger goes through.
`,
			},
		},
	},
};
