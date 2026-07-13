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
import { chartBar } from '@wordpress/icons';
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

// What `import( widget.renderModule )` resolves to in a real host.
const resolveDemoModule: ResolveWidgetModule = async () => ( {
	default: TrafficSnapshotWidget as ComponentType<
		WidgetRenderProps< unknown >
	>,
} );

// The same type placed twice, on a two-column and a one-column tile, so the
// header behavior can be compared across width budgets.
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
];

const meta: Meta< typeof WidgetDashboard > = {
	title: 'Widget Dashboard/WidgetDashboard',
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

function MultipleHighRelevanceAttributesStory() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( INITIAL_LAYOUT );

	return (
		// 1200px keeps the container resolver at four columns, so the
		// one-column tile stays at its narrowest realistic width (~280px).
		<div style={ { width: 1200 } }>
			<WidgetDashboard
				widgetTypes={ [ trafficSnapshotWidgetType ] }
				layout={ layout }
				onLayoutChange={ setLayout }
				resolveWidgetModule={ resolveDemoModule }
				gridSettings={ { model: 'grid', rowHeight: 200 } }
			>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
		</div>
	);
}

export const MultipleHighRelevanceAttributes: StoryObj = {
	render: () => <MultipleHighRelevanceAttributesStory />,
	parameters: {
		docs: {
			description: {
				story: `
In normal mode the dashboard promotes every \`relevance: 'high'\` attribute into the tile header as a bare inline control beside the identity, plus the settings entry point when a non-promoted attribute exists.

The demo type declares three attributes: \`metric\` and \`period\` are \`relevance: 'high'\`, and \`label\` stays on the settings drawer.

The same type is placed on two tiles:

- The two-column tile fits the identity and both inline controls.
- The one-column tile does not: the identity is the only region allowed to shrink, so the title collapses first and the controls can still overflow the header.

The promotion is unconditional while the header has a hard width budget. This story is the reproduction baseline for a fit or overflow policy in the tile chrome.
`,
			},
		},
	},
};
