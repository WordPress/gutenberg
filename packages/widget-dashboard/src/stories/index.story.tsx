import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
	ComponentProps,
	ComponentPropsWithoutRef,
	ComponentType,
} from 'react';
// Form controls and the command palette read these stylesheets, normally
// enqueued by WordPress.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/commands/build-style/style.css';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/components/build-style/style.css';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '@wordpress/dataviews/build-style/style.css';
import { Page } from '@wordpress/admin-ui';
import { CommandMenu } from '@wordpress/commands';
import {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { chartBar, download, trendingUp } from '@wordpress/icons';
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import type {
	ResolveWidgetModule,
	WidgetAction,
	WidgetAttributeField,
	WidgetHost,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { ROW_HEIGHT_PRESETS } from '../utils/row-height-presets';
import type { RowHeightPreset } from '../utils/row-height-presets';
import { WidgetDashboard } from '../widget-dashboard';
import type {
	CanPerformDashboardOperation,
	DashboardWidget,
	WidgetGridModel,
	WidgetGridSettings,
} from '../types';

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
	help: {
		content:
			'Three attributes. <strong>Metric</strong> and <strong>Period</strong> are <strong>high</strong> relevance — two fields in the header. <strong>Label</strong> is <strong>low</strong>, behind the settings button.',
	},
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

// A single promoted attribute: nothing is left for the settings surface.
const GOAL_FIELDS: WidgetAttributeField< GoalAttributes >[] = [
	{
		id: 'metric',
		label: 'Goal metric',
		type: 'text',
		elements: GOAL_METRICS,
		relevance: 'high',
	},
];

// Three declarative actions spanning the relevance scale: a high link and a
// medium download for the chrome footer, one at the default relevance for
// the More menu.
const GOAL_ACTIONS: WidgetAction[] = [
	{
		id: 'view-goal',
		label: 'View goal details',
		relevance: 'high',
		icon: chartBar,
		href: 'https://wordpress.org/',
		openInNewTab: true,
	},
	{
		id: 'export-progress',
		label: 'Export progress',
		relevance: 'medium',
		icon: download,
		href: new URL( './goal-progress.csv', import.meta.url ).href,
		download: 'goal-progress.csv',
	},
	{
		id: 'about-goals',
		label: 'About goals',
		href: 'https://wordpress.org/documentation/',
		openInNewTab: true,
	},
];

const goalProgressWidgetType: WidgetType = {
	apiVersion: 1,
	name: 'demo/goal-progress',
	title: 'Goal Progress',
	description: 'Sample goal widget whose attributes are all promoted.',
	help: {
		content:
			'One attribute, <strong>Goal metric</strong>, at <strong>high</strong> relevance: a single field in the header and no settings button. Two promoted actions in the footer (a link and a download), plus one in the <strong>More</strong> menu.',
	},
	icon: trendingUp,
	renderModule: 'demo/widgets/goal-progress/render',
	attributes: GOAL_FIELDS as WidgetType[ 'attributes' ],
	actions: GOAL_ACTIONS,
	example: {
		attributes: { metric: 'revenue', target: '5000' },
	},
};

// What `import( widget.renderModule )` resolves to in a real host.
const resolveDemoModule: ResolveWidgetModule = async ( moduleId ) => {
	let component: ComponentType< WidgetRenderProps< unknown > >;
	if ( moduleId === goalProgressWidgetType.renderModule ) {
		component = GoalProgressWidget as ComponentType<
			WidgetRenderProps< unknown >
		>;
	} else {
		component = TrafficSnapshotWidget as ComponentType<
			WidgetRenderProps< unknown >
		>;
	}
	return { default: component };
};

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
	title: 'Widget Dashboard/Playground',
	component: WidgetDashboard,
	tags: [ 'status-experimental' ],
	parameters: {
		// FIXME: Sortable widget chrome nests interactive controls (nested-interactive).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'The `@wordpress/widget-dashboard` package is under active development: APIs may change without notice. Recommended for development workflows only; not production-ready.',
		},
		docs: {
			description: {
				component: `
\`WidgetDashboard\` is the stateless rendering engine for widget dashboards: the consumer owns the \`layout\` state, every mutation flows back through \`onLayoutChange\`, and widget types arrive through the \`widgetTypes\` prop. What users may do on it is the application's answer, given through \`WidgetDashboard.Policy\`.
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

// The snapshot type under a title no tile fits comfortably, so the identity's
// truncation shows at the widths the grid offers.
const longTitleWidgetType: WidgetType = {
	...trafficSnapshotWidgetType,
	name: 'demo/long-title',
	title: 'Traffic Snapshot Against the Quarterly Revenue Target',
};

const LONG_TITLE_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'long-title-wide',
		type: 'demo/long-title',
		attributes: { metric: 'views', period: 'week', label: 'Traffic' },
		placement: { width: 2, height: 1, order: 1 },
	},
	{
		uuid: 'long-title-narrow',
		type: 'demo/long-title',
		attributes: { metric: 'visitors', period: 'month', label: 'Audience' },
		placement: { width: 1, height: 1, order: 2 },
	},
];

function LongTitleStory() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( LONG_TITLE_LAYOUT );

	return (
		<WidgetDashboard
			widgetTypes={ [ longTitleWidgetType ] }
			layout={ layout }
			onLayoutChange={ setLayout }
			resolveWidgetModule={ resolveDemoModule }
			gridSettings={ { model: 'grid', rowHeight: 200 } }
		>
			<WidgetDashboard.Widgets />
		</WidgetDashboard>
	);
}

export const LongTitle: StoryObj = {
	render: () => <LongTitleStory />,
	parameters: {
		docs: {
			description: {
				story: `
The identity holds the widget type's title. When the row cannot fit it, the title truncates with an ellipsis rather than wrapping: the header is one line tall.

The same type appears at two widths. Resize the canvas to watch where the cut lands.
`,
			},
		},
	},
};

export const Default: StoryObj = {
	render: () => <DefaultStory />,
	parameters: {
		docs: {
			description: {
				story: `
In normal mode the dashboard promotes every \`relevance: 'high'\` attribute into the tile header as a bare inline control beside the identity, plus the settings entry point when a non-promoted attribute exists.

Two demo types exercise that policy:

- \`demo/traffic-snapshot\` declares three attributes: \`metric\` and \`period\` are \`relevance: 'high'\`, and \`label\` stays on the settings surface.
- \`demo/goal-progress\` declares a single attribute at \`relevance: 'high'\`: with nothing left for the settings surface, the inline presentation shows no settings entry point.

Their tiles compare the header presentations:

- The two-column tile fits the identity and both inline controls, so they stay in the header.
- The one-column traffic tile does not: the promoted fields collapse into a dropdown holding them as a form, while the settings trigger stays in the toolbar beside it.
- The one-column goal tile carries a single promoted field and no settings surface, so its toolbar holds that field and the actions menu.

The widget only declares relevance; the fit is measured by the chrome, so the same declaration adapts to any tile width. Resize the canvas to watch the headers switch presentations.

Beyond attributes, \`demo/goal-progress\` declares three \`actions\` spanning the relevance scale, and that scale routes them: "View goal details" at \`'high'\` mounts as a leading text link (declared icon as prefix) in a persistent chrome footer, "Export progress" at \`'medium'\` beside it as a trailing icon-only link, and "About goals" at the default \`'low'\` lands in the "More" menu. The widget declares each action as data plus its importance; the host owns the surfaces.

Each type also carries a \`help\` note, opened from the info icon in the header, that describes its attributes and what they do.
`,
			},
		},
	},
};

/*
 * The host-links demo: a fake application that owns the `/reports` route.
 * Its `match` recognizes the portable href form; its link primitive logs
 * the client-side navigation instead of mounting a real router.
 */
const DEMO_NAVIGATE_EVENT = 'widget-dashboard-demo-navigate';

const DemoRouteLink = forwardRef<
	HTMLAnchorElement,
	{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >
>( function DemoRouteLink( { path, onClick, children, ...props }, ref ) {
	return (
		<a
			ref={ ref }
			{ ...props }
			href={ `?p=${ path }` }
			onClick={ ( event ) => {
				event.preventDefault();
				window.dispatchEvent(
					new CustomEvent( DEMO_NAVIGATE_EVENT, { detail: path } )
				);
				onClick?.( event );
			} }
		>
			{ children }
		</a>
	);
} );

const DEMO_PAGE = 'https://demo.example/wp-admin/admin.php?page=demo-dashboard';

const demoHost: WidgetHost = {
	links: {
		match: ( href ) => {
			let url: URL;
			try {
				url = new URL( href, DEMO_PAGE );
			} catch {
				return null;
			}

			if (
				url.pathname !== '/wp-admin/admin.php' ||
				url.searchParams.get( 'page' ) !== 'demo-dashboard'
			) {
				return null;
			}

			return url.searchParams.get( 'p' ) ?? '/';
		},
		Link: DemoRouteLink,
	},
};

// The goal type plus an in-app target, so the footer shows all three link
// materializations side by side: route link, plain anchor, download.
const hostLinksWidgetType: WidgetType = {
	...goalProgressWidgetType,
	name: 'demo/goal-progress-links',
	help: {
		content:
			'The footer holds an in-app route link, an external link, and a download; the <strong>More</strong> menu keeps the rest.',
	},
	actions: [
		{
			id: 'see-report',
			label: 'See report',
			relevance: 'high',
			href: 'admin.php?page=demo-dashboard&p=/reports',
		},
		...GOAL_ACTIONS,
	],
};

const HOST_LINKS_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'goal-progress-links',
		type: 'demo/goal-progress-links',
		attributes: { metric: 'revenue', target: '5000' },
		placement: { width: 2, height: 1, order: 1 },
	},
];

function HostLinksStory() {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( HOST_LINKS_LAYOUT );

	const [ lastNavigation, setLastNavigation ] = useState< {
		path: string;
	} | null >( null );

	useEffect( () => {
		// A fresh object per event, so repeated clicks restart the timer.
		const onNavigate = ( event: Event ) =>
			setLastNavigation( {
				path: ( event as CustomEvent< string > ).detail,
			} );

		window.addEventListener( DEMO_NAVIGATE_EVENT, onNavigate );
		return () =>
			window.removeEventListener( DEMO_NAVIGATE_EVENT, onNavigate );
	}, [] );

	// The confirmation stays up briefly, then the idle prompt returns, so
	// every navigation produces visible feedback.
	useEffect( () => {
		if ( ! lastNavigation ) {
			return;
		}

		const timer = setTimeout( () => setLastNavigation( null ), 3000 );
		return () => clearTimeout( timer );
	}, [ lastNavigation ] );

	return (
		<WidgetHostProvider value={ demoHost }>
			<p
				role="status"
				style={ {
					color: 'var(--wpds-color-foreground-content-neutral-weak)',
					fontSize: 'var(--wpds-typography-font-size-sm)',
				} }
			>
				{ lastNavigation
					? `Client-side navigation to ${ lastNavigation.path }; the document never reloaded.`
					: 'Pick "See report" in the widget footer: its target is a route this demo host owns.' }
			</p>

			<WidgetDashboard
				widgetTypes={ [ hostLinksWidgetType ] }
				layout={ layout }
				onLayoutChange={ setLayout }
				resolveWidgetModule={ resolveDemoModule }
				gridSettings={ { model: 'grid', rowHeight: 200 } }
			>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
		</WidgetHostProvider>
	);
}

export const HostLinks: StoryObj = {
	render: () => <HostLinksStory />,
	parameters: {
		docs: {
			description: {
				story: `
The widget declares where to go; the host decides how to get there. This story mounts a \`WidgetHostProvider\` whose \`links\` capability recognizes hrefs targeting the demo application's own routes.

The footer shows the three materializations side by side:

- "See report" declares \`admin.php?page=demo-dashboard&p=/reports\`, a route this host owns: it mounts the host's route link and navigates client-side; the status line above confirms the document never reloaded.
- "View goal details" opens another origin in a new tab: a plain anchor.
- "Export progress" is a download: downloads always keep the plain anchor.

Without the provider the same declarations still work; every action falls back to a plain anchor. Real hosts implement the capability at their route layer with their actual router.
`,
			},
		},
	},
};

/*
 * The policy demo: an application with user profiles and sections. The
 * profile decides which operations the user may perform; the active section
 * decides what the inserter offers. The widget types never change.
 */
const POLICY_SECTIONS = [
	{ label: 'All', href: '/analytics', type: null },
	{
		label: 'Traffic',
		href: '/analytics/traffic',
		type: 'demo/traffic-snapshot',
	},
	{ label: 'Goals', href: '/analytics/goals', type: 'demo/goal-progress' },
] as const;

type PolicySectionHref = ( typeof POLICY_SECTIONS )[ number ][ 'href' ];

const PROFILES = {
	viewer: {
		label: 'Viewer',
		summary: 'reads the dashboard and edits nothing',
		operations: [] as readonly string[],
	},
	arranger: {
		label: 'Arranger',
		summary:
			'may customize, move, and resize; never adds, removes, edits, or resets',
		operations: [ 'customize', 'move', 'resize' ] as readonly string[],
	},
	owner: {
		label: 'Owner',
		summary: 'may do everything',
		operations: 'all' as const,
	},
};

type Profile = keyof typeof PROFILES;

type PageLink = NonNullable<
	NonNullable< ComponentProps< typeof Page >[ 'components' ] >[ 'link' ]
>;

interface PolicyStoryProps {
	profile: Profile;
}

function PolicyStory( { profile }: PolicyStoryProps ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( INITIAL_LAYOUT );
	const [ editMode, setEditMode ] = useState( false );
	const [ currentHref, setCurrentHref ] =
		useState< PolicySectionHref >( '/analytics' );

	const canPerform = useMemo< CanPerformDashboardOperation >( () => {
		const { operations } = PROFILES[ profile ];
		const sectionType = POLICY_SECTIONS.find(
			( section ) => section.href === currentHref
		)?.type;
		return ( request ) => {
			if (
				operations !== 'all' &&
				! operations.includes( request.operation )
			) {
				return false;
			}
			if ( request.operation === 'insert' ) {
				return ! sectionType || request.widgetType.name === sectionType;
			}
			return true;
		};
	}, [ profile, currentHref ] );

	// Section links drive local state instead of a router.
	const link = useCallback< PageLink >(
		( { href, onClick, children, ...props } ) => (
			<a
				{ ...props }
				href={ href }
				onClick={ ( event ) => {
					event.preventDefault();
					setCurrentHref( href as PolicySectionHref );
					onClick?.( event );
				} }
			>
				{ children }
			</a>
		),
		[]
	);

	// Storybook forwards every keydown to its manager (`window.onkeydown`)
	// without honoring `defaultPrevented`, so its own search would answer
	// the palette combination too. Stop the event before it leaves the
	// document; the palette's global shortcut listens on the document as
	// well, and `stopPropagation` never affects same-target listeners.
	useEffect( () => {
		const containPaletteShortcut = ( event: KeyboardEvent ) => {
			if (
				( event.metaKey || event.ctrlKey ) &&
				! event.shiftKey &&
				! event.altKey &&
				event.key.toLowerCase() === 'k'
			) {
				event.stopPropagation();
			}
		};
		document.addEventListener( 'keydown', containPaletteShortcut );
		return () =>
			document.removeEventListener( 'keydown', containPaletteShortcut );
	}, [] );

	const { label, summary } = PROFILES[ profile ];

	return (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			<WidgetDashboard
				widgetTypes={ [
					trafficSnapshotWidgetType,
					goalProgressWidgetType,
				] }
				layout={ layout }
				onLayoutChange={ setLayout }
				onLayoutReset={ () => setLayout( INITIAL_LAYOUT ) }
				editMode={ editMode }
				onEditChange={ setEditMode }
				resolveWidgetModule={ resolveDemoModule }
				gridSettings={ { model: 'grid', rowHeight: 200 } }
			>
				<Page
					title="Analytics"
					subTitle={ `Signed in as ${ label }: ${ summary }. The section scopes what "Add widget" offers.` }
					actions={ <WidgetDashboard.Actions /> }
					navigation={ {
						items: POLICY_SECTIONS.map(
							( { label: text, href } ) => ( {
								label: text,
								href,
							} )
						),
						currentHref,
						ariaLabel: 'Sections',
					} }
					components={ { link } }
					showSidebarToggle={ false }
					hasPadding
				>
					<WidgetDashboard.Widgets />
					<WidgetDashboard.Commands />
					<CommandMenu />
				</Page>
			</WidgetDashboard>
		</WidgetDashboard.Policy>
	);
}

export const Policy: StoryObj< PolicyStoryProps > = {
	render: ( args ) => <PolicyStory { ...args } />,
	args: {
		profile: 'owner',
	},
	argTypes: {
		profile: {
			control: 'select',
			options: Object.keys( PROFILES ),
			description:
				'The user profile the application maps to a policy. Viewer: nothing. Arranger: customize, move, resize. Owner: everything, including reset.',
		},
	},
	parameters: {
		docs: {
			description: {
				story: `
The application governs the dashboard; the widget types stay untouched. This story mounts \`WidgetDashboard.Policy\` around the dashboard with a \`canPerform\` closing over the signed-in profile and the active section, and composes the dashboard inside an admin \`Page\`: the section links in its navigation, the dashboard actions in its actions slot.

Switch the \`profile\` control. A Viewer gets no Customize button, no Reset to default entry, no attribute controls, and read-only widgets (no \`setAttributes\`). An Arranger enters customize mode and drags or resizes tiles, but has no Add widget trigger, no Reset to default entry, no Remove control, and no attribute editing. An Owner does everything.

The command palette is mounted too: press ⌘K (Ctrl+K outside macOS) and the commands follow the same policy. An Owner sees Customize dashboard, Add dashboard widgets, and Reset dashboard widgets to default; an Arranger keeps Customize dashboard only; a Viewer gets no dashboard commands.

Switch the section, then open "Add widget": the listing follows the section, even while open; the excluded types keep rendering where already placed because the \`widgetTypes\` registry never changes.

Nested policies compose restrictively; without a policy, every operation is allowed. See the **Policy** page for the contract.
`,
			},
		},
	},
};

// A fuller board than INITIAL_LAYOUT: a hero spanning the whole first row at
// any column count (the grid clamps the span), then a rank of small tiles so
// the columns control visibly repacks them.
const GRID_SETTINGS_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'grid-settings-traffic-week',
		type: 'demo/traffic-snapshot',
		attributes: { metric: 'views', period: 'week', label: 'Traffic' },
		placement: { width: 2, height: 1, order: 1 },
	},
	{
		uuid: 'grid-settings-goal-revenue',
		type: 'demo/goal-progress',
		attributes: { metric: 'revenue', target: '5000' },
		placement: { width: 1, height: 1, order: 2 },
	},
	{
		uuid: 'grid-settings-audience-tall',
		type: 'demo/traffic-snapshot',
		attributes: { metric: 'visitors', period: 'month', label: 'Audience' },
		placement: { width: 1, height: 2, order: 3 },
	},
	{
		uuid: 'grid-settings-goal-orders',
		type: 'demo/goal-progress',
		attributes: { metric: 'orders', target: '1000' },
		placement: { width: 2, height: 1, order: 4 },
	},
	{
		uuid: 'grid-settings-traffic-day',
		type: 'demo/traffic-snapshot',
		attributes: { metric: 'views', period: 'day', label: 'Today' },
		placement: { width: 1, height: 1, order: 5 },
	},
	{
		uuid: 'grid-settings-goal-stretch',
		type: 'demo/goal-progress',
		attributes: { metric: 'revenue', target: '10000' },
		placement: { width: 1, height: 1, order: 6 },
	},
];

type GridSettingsStoryProps = {
	columns: number;
	model: WidgetGridModel;
	rowHeight: RowHeightPreset;
	flowTolerance: number;
};

// The ladder in words, so the caption tracks the count the story asked for
// rather than describing the four-column default.
function describeColumnSteps( columns: number ): string {
	if ( columns === 1 ) {
		return 'one column at every width';
	}

	const middle = Math.min( 2, columns );
	if ( middle === columns ) {
		return `${ columns } columns until the container narrows to one`;
	}

	return `${ columns } columns on a wide container, ${ middle } as it narrows, then one`;
}

function GridSettingsStory( {
	columns,
	model,
	rowHeight,
	flowTolerance,
}: GridSettingsStoryProps ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( GRID_SETTINGS_LAYOUT );
	const [ editMode, setEditMode ] = useState( false );

	// The settings union is per model: `rowHeight` belongs to the grid and
	// `flowTolerance` to masonry, so only the active model's field travels.
	const gridSettings = useMemo< WidgetGridSettings >(
		() =>
			model === 'masonry'
				? { model, columns, flowTolerance }
				: {
						model,
						columns,
						rowHeight: ROW_HEIGHT_PRESETS[ rowHeight ],
				  },
		[ model, columns, flowTolerance, rowHeight ]
	);

	return (
		<WidgetDashboard
			widgetTypes={ [
				trafficSnapshotWidgetType,
				goalProgressWidgetType,
			] }
			layout={ layout }
			onLayoutChange={ setLayout }
			editMode={ editMode }
			onEditChange={ setEditMode }
			resolveWidgetModule={ resolveDemoModule }
			gridSettings={ gridSettings }
		>
			<Page
				title="Dashboard"
				subTitle={ `${
					model === 'masonry' ? 'Masonry' : 'Standard grid'
				}: ${ describeColumnSteps( columns ) }.` }
				actions={ <WidgetDashboard.Actions /> }
				showSidebarToggle={ false }
				hasPadding
			>
				<WidgetDashboard.Widgets />
			</Page>
		</WidgetDashboard>
	);
}

export const GridSettings: StoryObj< GridSettingsStoryProps > = {
	render: ( args ) => <GridSettingsStory { ...args } />,
	args: {
		columns: 4,
		model: 'grid',
		rowHeight: 'medium',
		flowTolerance: 16,
	},
	argTypes: {
		columns: {
			control: { type: 'range', min: 1, max: 12, step: 1 },
			description:
				'Wide-container column count. The host decides; the package only floors it at one.',
		},
		model: {
			control: 'radio',
			options: [ 'grid', 'masonry' ],
			description:
				'The grid model. `grid` gives uniform rows and two-axis spans; `masonry` drives heights from content.',
		},
		rowHeight: {
			control: 'radio',
			options: Object.keys( ROW_HEIGHT_PRESETS ),
			description: 'Height of each grid row. Grid model only.',
			if: { arg: 'model', eq: 'grid' },
		},
		flowTolerance: {
			control: { type: 'range', min: 0, max: 200, step: 4 },
			description:
				'Pixel tolerance for source-order tiebreaking between lanes. Masonry model only.',
			if: { arg: 'model', eq: 'masonry' },
		},
	},
	parameters: {
		controls: {
			include: [ 'columns', 'model', 'rowHeight', 'flowTolerance' ],
		},
		docs: {
			description: {
				story: `
The \`gridSettings\` prop carries the host's layout decisions. \`columns\` sets the wide-container count (\`WIDGET_DASHBOARD_COLUMN_COUNT\` is only the default when the host sets nothing), and container width steps the effective count down to \`min( 2, count )\` and then one as it narrows. Drag the columns control; resize the canvas to watch the steps.

\`model\` picks the surface, and the per-model field follows it: \`rowHeight\` belongs to \`grid\`, \`flowTolerance\` to \`masonry\`. Only the active one is passed in \`gridSettings\`, and only its control is shown.

Tile spans are stored per widget and do not scale with the count. Raise \`columns\` and every track narrows, so the same spans cover less of the surface. Enter Customize and resize a tile to see it take the new count.
`,
			},
		},
	},
};
