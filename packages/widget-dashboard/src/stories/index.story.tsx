/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
// Form controls read these stylesheets, normally enqueued by WordPress.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/components/build-style/style.css';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/dataviews/build-style/style.css';
import { useState } from '@wordpress/element';
import { chartBar, trendingUp } from '@wordpress/icons';
import type {
	ResolveWidgetModule,
	WidgetAttributeField,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

/*
 * Stories run without WordPress, so both halves of the demo widget are
 * declared inline: the type through `widgetTypes`, the render component
 * through `resolveWidgetModule`.
 */

interface SnapshotAttributes {
	metric?: 'views' | 'visitors' | 'orders';
	period?: 'day' | 'week' | 'month';
	label?: string;
}

const METRICS: {
	value: NonNullable< SnapshotAttributes[ 'metric' ] >;
	label: string;
}[] = [
	{ value: 'views', label: 'Views' },
	{ value: 'visitors', label: 'Visitors' },
	{ value: 'orders', label: 'Orders' },
];

const PERIODS: {
	value: NonNullable< SnapshotAttributes[ 'period' ] >;
	label: string;
}[] = [
	{ value: 'day', label: 'Last 24 hours' },
	{ value: 'week', label: 'Last 7 days' },
	{ value: 'month', label: 'Last 30 days' },
];

// Deterministic sample counts keyed by metric, then period.
const SAMPLE_COUNTS: Record<
	NonNullable< SnapshotAttributes[ 'metric' ] >,
	Record< NonNullable< SnapshotAttributes[ 'period' ] >, number >
> = {
	views: { day: 1284, week: 9051, month: 38402 },
	visitors: { day: 342, week: 2410, month: 10236 },
	orders: { day: 12, week: 87, month: 356 },
};

function TrafficSnapshotWidget( {
	attributes,
}: WidgetRenderProps< SnapshotAttributes > ) {
	const {
		metric = 'views',
		period = 'week',
		label = 'Traffic',
	} = attributes ?? {};

	const metricLabel =
		METRICS.find( ( entry ) => entry.value === metric )?.label ?? metric;
	const periodLabel =
		PERIODS.find( ( entry ) => entry.value === period )?.label ?? period;

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
				{ SAMPLE_COUNTS[ metric ][ period ].toLocaleString( 'en-US' ) }
			</strong>
			<span
				style={ {
					color: 'var(--wpds-color-foreground-content-neutral-weak)',
					fontSize: 'var(--wpds-typography-font-size-sm)',
				} }
			>
				{ `${ label }: ${ metricLabel }, ${ periodLabel }` }
			</span>
		</div>
	);
}

// Three attributes; only `metric` and `period` carry `relevance: 'high'`.
const SNAPSHOT_FIELDS: WidgetAttributeField< SnapshotAttributes >[] = [
	{
		id: 'metric',
		label: 'Metric',
		type: 'text',
		elements: METRICS,
		relevance: 'high',
	},
	{
		id: 'period',
		label: 'Period',
		type: 'text',
		elements: PERIODS,
		relevance: 'high',
	},
	{
		id: 'label',
		label: 'Label',
		type: 'text',
	},
];

const trafficSnapshotWidgetType: WidgetType = {
	apiVersion: 1,
	name: 'demo/traffic-snapshot',
	title: 'Traffic Snapshot',
	description:
		'Sample metric widget used to exercise the inline attribute controls.',
	icon: chartBar,
	renderModule: 'demo/widgets/traffic-snapshot/render',
	attributes: SNAPSHOT_FIELDS as WidgetType[ 'attributes' ],
	example: {
		attributes: { metric: 'views', period: 'week', label: 'Traffic' },
	},
};

interface GoalAttributes {
	metric?: 'revenue' | 'orders';
	target?: string;
}

const GOAL_METRICS: {
	value: NonNullable< GoalAttributes[ 'metric' ] >;
	label: string;
}[] = [
	{ value: 'revenue', label: 'Revenue' },
	{ value: 'orders', label: 'Orders' },
];

const GOAL_TARGETS = [
	{ value: '1000', label: '1K target' },
	{ value: '5000', label: '5K target' },
	{ value: '10000', label: '10K target' },
];

// Deterministic current values, keyed by metric.
const GOAL_CURRENT: Record<
	NonNullable< GoalAttributes[ 'metric' ] >,
	number
> = {
	revenue: 3600,
	orders: 118,
};

function GoalProgressWidget( {
	attributes,
}: WidgetRenderProps< GoalAttributes > ) {
	const { metric = 'revenue', target = '5000' } = attributes ?? {};

	const metricLabel =
		GOAL_METRICS.find( ( entry ) => entry.value === metric )?.label ??
		metric;
	const targetLabel =
		GOAL_TARGETS.find( ( entry ) => entry.value === target )?.label ??
		target;
	const percent = Math.min(
		100,
		Math.round( ( GOAL_CURRENT[ metric ] / Number( target ) ) * 100 )
	);

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
				{ `${ percent }%` }
			</strong>
			<div
				style={ {
					background:
						'var(--wpds-color-background-surface-neutral-weak)',
					borderRadius: 'var(--wpds-border-radius-md)',
					height: 8,
					overflow: 'hidden',
				} }
			>
				<div
					style={ {
						background:
							'var(--wpds-color-background-surface-brand)',
						height: '100%',
						width: `${ percent }%`,
					} }
				/>
			</div>
			<span
				style={ {
					color: 'var(--wpds-color-foreground-content-neutral-weak)',
					fontSize: 'var(--wpds-typography-font-size-sm)',
				} }
			>
				{ `${ metricLabel } vs ${ targetLabel }` }
			</span>
		</div>
	);
}

// Two attributes, both promoted: nothing is left for the settings surface.
const GOAL_FIELDS: WidgetAttributeField< GoalAttributes >[] = [
	{
		id: 'metric',
		label: 'Goal metric',
		type: 'text',
		elements: GOAL_METRICS,
		relevance: 'high',
	},
	{
		id: 'target',
		label: 'Target',
		type: 'text',
		elements: GOAL_TARGETS,
		relevance: 'high',
	},
];

const goalProgressWidgetType: WidgetType = {
	apiVersion: 1,
	name: 'demo/goal-progress',
	title: 'Goal Progress',
	description: 'Sample goal widget whose attributes are all promoted.',
	icon: trendingUp,
	renderModule: 'demo/widgets/goal-progress/render',
	attributes: GOAL_FIELDS as WidgetType[ 'attributes' ],
	example: {
		attributes: { metric: 'revenue', target: '5000' },
	},
};

// What `import( widget.renderModule )` resolves to in a real host.
const resolveDemoModule: ResolveWidgetModule = async ( moduleId ) => ( {
	default: ( moduleId === goalProgressWidgetType.renderModule
		? GoalProgressWidget
		: TrafficSnapshotWidget ) as ComponentType<
		WidgetRenderProps< unknown >
	>,
} );

// The snapshot type at two widths, plus a one-column goal tile whose
// attributes are all promoted, so the header presentations can be compared
// across width budgets and attribute mixes.
const INITIAL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'traffic-snapshot-wide',
		type: 'demo/traffic-snapshot',
		attributes: { metric: 'views', period: 'week', label: 'Traffic' },
		placement: { width: 2, height: 1, order: 1 },
	},
	{
		uuid: 'traffic-snapshot-narrow',
		type: 'demo/traffic-snapshot',
		attributes: { metric: 'visitors', period: 'month', label: 'Audience' },
		placement: { width: 1, height: 1, order: 2 },
	},
	{
		uuid: 'goal-progress-narrow',
		type: 'demo/goal-progress',
		attributes: { metric: 'revenue', target: '5000' },
		placement: { width: 1, height: 1, order: 3 },
	},
];

const meta: Meta< typeof WidgetDashboard > = {
	title: 'Widget Dashboard',
	component: WidgetDashboard,
	tags: [ 'status-experimental' ],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'The `@wordpress/widget-dashboard` package is under active development: APIs may change without notice. Recommended for development workflows only; not production-ready.',
		},
		docs: {
			description: {
				component: `
\`WidgetDashboard\` is the stateless rendering engine for widget dashboards: the consumer owns the \`layout\` state, every mutation flows back through \`onLayoutChange\`, and widget types arrive through the \`widgetTypes\` prop.
`,
			},
		},
	},
};

export default meta;

function DefaultStory() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( INITIAL_LAYOUT );

	return (
		<WidgetDashboard
			widgetTypes={ [
				trafficSnapshotWidgetType,
				goalProgressWidgetType,
			] }
			layout={ layout }
			onLayoutChange={ setLayout }
			resolveWidgetModule={ resolveDemoModule }
			gridSettings={ { model: 'grid', rowHeight: 200 } }
		>
			<WidgetDashboard.Widgets />
		</WidgetDashboard>
	);
}

export const Default: StoryObj = {
	render: () => <DefaultStory />,
	parameters: {
		docs: {
			description: {
				story: `
In normal mode the dashboard promotes every \`relevance: 'high'\` attribute into the tile header as a bare inline control beside the identity, plus the settings entry point when a non-promoted attribute exists.

Two demo types exercise that policy:

- \`demo/traffic-snapshot\` declares three attributes: \`metric\` and \`period\` are \`relevance: 'high'\`, and \`label\` stays on the settings surface.
- \`demo/goal-progress\` declares two attributes, both \`relevance: 'high'\`: with nothing left for the settings surface, the inline presentation shows no settings entry point.

Their tiles compare the header presentations:

- The two-column tile fits the identity and both inline controls, so they stay in the header.
- The one-column tiles do not: the promoted fields collapse into a dropdown holding them as a form, while the settings trigger stays in the toolbar beside it. The goal tile, with every attribute promoted, shows only the dropdown.

The widget only declares relevance; the fit is measured by the chrome, so the same declaration adapts to any tile width. Resize the canvas to watch the headers switch presentations.
`,
			},
		},
	},
};
