import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';
import { DataForm, useFormValidity } from '@wordpress/dataviews';
import type { DataFormControlProps, Field, Form } from '@wordpress/dataviews';
import {
	Suspense,
	forwardRef,
	useEffect,
	useId,
	useMemo,
	useState,
} from '@wordpress/element';
import { globe, starFilled } from '@wordpress/icons';
// `IconButton` is not on the recommended list yet.
/* eslint-disable @wordpress/use-recommended-components */
import { Button, Card, Icon, IconButton, Link, Stack } from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */
import { WidgetRender } from '..';
import { registerFieldType, resolveFields } from '../../../field-types';
import { registerIconResolver, resolveIcon } from '../../../icon-resolver';
import { HostLink, WidgetHostProvider } from '../../../widget-host';
import type { WidgetHost, WidgetHostLinks } from '../../../widget-host';
import type {
	WidgetAction,
	WidgetAttributeField,
	WidgetIcon,
	WidgetRenderProps,
	WidgetType,
} from '../../../types';

/*
 * Stories run without WordPress, so both halves are declared inline: the
 * type through the `widgetType` prop, the component through
 * `resolveWidgetModule`.
 */

interface DemoAttributes {
	greeting?: string;
	world?: 'earth' | 'moon' | 'mars' | 'saturn';
}

const WORLDS: {
	value: NonNullable< DemoAttributes[ 'world' ] >;
	label: string;
	emoji: string;
	background: string;
}[] = [
	{
		value: 'earth',
		label: 'World',
		emoji: '🌍',
		background: 'var(--wpds-color-background-surface-info-weak)',
	},
	{
		value: 'moon',
		label: 'Moon',
		emoji: '🌕',
		background: 'var(--wpds-color-background-surface-neutral)',
	},
	{
		value: 'mars',
		label: 'Mars',
		emoji: '🔴',
		background: 'var(--wpds-color-background-surface-caution-weak)',
	},
	{
		value: 'saturn',
		label: 'Saturn',
		emoji: '🪐',
		background: 'var(--wpds-color-background-surface-warning-weak)',
	},
];

function DemoWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< DemoAttributes > ) {
	const { greeting = 'Hello', world = 'earth' } = attributes ?? {};
	const index = Math.max(
		0,
		WORLDS.findIndex( ( entry ) => entry.value === world )
	);
	const current = WORLDS[ index ];

	return (
		<div
			style={ {
				background: current.background,
				border: '1px solid var(--wpds-color-stroke-surface-neutral)',
				borderRadius: 'var(--wpds-border-radius-md)',
				color: 'var(--wpds-color-foreground-content-neutral)',
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-md)',
				justifyItems: 'center',
				padding: 'var(--wpds-dimension-padding-xl)',
			} }
		>
			<strong style={ { fontSize: '1.5em' } }>
				{ `${ greeting }, ${ current.label }! ${ current.emoji }` }
			</strong>

			{ setAttributes && (
				<button
					onClick={ () =>
						setAttributes( {
							world: WORLDS[ ( index + 1 ) % WORLDS.length ]
								.value,
						} )
					}
				>
					Next world
				</button>
			) }
		</div>
	);
}

const demoWidgetType: WidgetType< DemoAttributes > = {
	apiVersion: 1,
	name: 'demo/hello-world',
	title: 'Hello World',
	description: 'Minimal widget that greets worlds near and far.',
	icon: globe,
	renderModule: 'demo/widgets/hello-world/render',
	attributes: [
		{
			id: 'greeting',
			label: 'Greeting',
			type: 'text',
			isValid: { required: true },
		},
		{
			id: 'world',
			label: 'World',
			type: 'text',
			elements: WORLDS.map( ( { value, label } ) => ( {
				value,
				label,
			} ) ),
		},
	] as Field< DemoAttributes >[],
	example: {
		attributes: { greeting: 'Hello', world: 'mars' },
	},
};

// What `import( widget.renderModule )` resolves to in a real host.
const resolveDemoModule = async () => ( {
	default: DemoWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const meta: Meta< typeof WidgetRender > = {
	id: 'widget-primitives-widgetrender',
	title: 'Widgets/Primitives/WidgetRender',
	component: WidgetRender,
	tags: [ 'status-experimental' ],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'The `@wordpress/widget-primitives` package is under active development: APIs may change without notice. Recommended for development workflows only; not production-ready.',
		},
		docs: {
			description: {
				component: `
\`WidgetRender\` is the host-agnostic entry point that renders a widget type: it resolves the widget's render component and mounts it with the current attributes.

A host provides three things:

- \`widgetType\`: the widget's metadata, as declared by its author. In a host it arrives through \`useWidgetTypes()\`.
- \`resolveWidgetModule\`: how the render component is loaded. Dynamic \`import()\` against an import map, eagerly enqueued script modules, or a custom resolver are all valid strategies.
- \`setAttributes\` (optional): grants the widget write access to its own attributes. Omit it and the widget renders read-only.
`,
			},
		},
	},
};

export default meta;

function DefaultStory() {
	const [ attributes, setAttributes ] = useState< DemoAttributes >( {
		...demoWidgetType.example?.attributes,
	} );

	return (
		<Suspense fallback={ null }>
			<WidgetRender< DemoAttributes >
				widgetType={ demoWidgetType }
				attributes={ attributes }
				setAttributes={ ( next ) =>
					setAttributes( ( prev ) => ( { ...prev, ...next } ) )
				}
				resolveWidgetModule={ resolveDemoModule }
			/>
		</Suspense>
	);
}

export const Default: StoryObj = {
	render: () => <DefaultStory />,
	parameters: {
		docs: {
			description: {
				story: `
The minimal contract between a host and a widget:

- \`attributes\` flow into the widget as plain data.
- The widget writes back through \`setAttributes\`, which the host provides. The "Next world" button calls it from inside the widget, and the host applies the change.

The primitive resolves the render component with \`lazy()\`, so the surrounding \`Suspense\` boundary, and with it the loading UI, is a host decision.
`,
			},
		},
	},
};

function WidgetWithSettings() {
	const [ attributes, setAttributes ] = useState< DemoAttributes >( {
		...demoWidgetType.example?.attributes,
	} );

	const fields = demoWidgetType.attributes as Field< DemoAttributes >[];

	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: fields.map( ( field ) => field.id ),
		} ),
		[ fields ]
	);

	const applyEdits = ( edits: Partial< DemoAttributes > ) =>
		setAttributes( ( prev ) => ( { ...prev, ...edits } ) );

	const { validity } = useFormValidity( attributes, fields, form );

	return (
		<div
			style={ {
				alignItems: 'start',
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-xl)',
				gridTemplateColumns: '2fr 1fr',
			} }
		>
			<Suspense fallback={ null }>
				<WidgetRender< DemoAttributes >
					widgetType={ demoWidgetType }
					attributes={ attributes }
					resolveWidgetModule={ resolveDemoModule }
				/>
			</Suspense>
			<aside
				style={ {
					border: '1px solid var(--wpds-color-stroke-surface-neutral)',
					borderRadius: 'var(--wpds-border-radius-md)',
					padding: 'var(--wpds-dimension-padding-lg)',
				} }
			>
				<DataForm< DemoAttributes >
					data={ attributes }
					fields={ fields }
					form={ form }
					validity={ validity }
					onChange={ applyEdits }
				/>
			</aside>
		</div>
	);
}

export const WithSettings: StoryObj = {
	render: () => <WidgetWithSettings />,
	parameters: {
		docs: {
			description: {
				story: `
Where Default lets the widget ask for changes, here the host edits the values itself. A widget type declares its settings as a DataViews \`Field[]\` under \`attributes\`, and that single declaration is enough for a host to build a settings UI:

- The \`DataForm\` on the right is mounted straight from the schema, with no per-widget form wiring.
- Validation comes from the same source: the \`greeting\` field is marked as required, and \`useFormValidity\` surfaces the result in the form.
- Edits flow into the rendered widget on the left through the shared attributes state.

Any host can derive its settings UI this way, whatever shape it takes.
`,
			},
		},
	},
};

function WidgetInHostChrome() {
	const [ attributes, setAttributes ] = useState< DemoAttributes >( {
		...demoWidgetType.example?.attributes,
	} );

	const titleId = useId();

	return (
		<Card.Root
			render={ <section /> }
			aria-labelledby={ titleId }
			style={ {
				// Striped background to tell the chrome apart from the render.
				background: `repeating-linear-gradient(
					45deg,
					var(--wpds-color-background-surface-neutral),
					var(--wpds-color-background-surface-neutral) 8px,
					var(--wpds-color-background-surface-neutral-weak) 8px,
					var(--wpds-color-background-surface-neutral-weak) 16px
				)`,
				maxWidth: 480,
			} }
		>
			<Card.Header>
				<Stack direction="row" align="center" gap="sm">
					{ demoWidgetType.icon && (
						<span aria-hidden="true">
							<Icon icon={ demoWidgetType.icon } />
						</span>
					) }
					<Card.Title id={ titleId } render={ <h3 /> }>
						{ demoWidgetType.title }
					</Card.Title>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Suspense fallback={ null }>
					<WidgetRender< DemoAttributes >
						widgetType={ demoWidgetType }
						attributes={ attributes }
						setAttributes={ ( next ) =>
							setAttributes( ( prev ) => ( {
								...prev,
								...next,
							} ) )
						}
						resolveWidgetModule={ resolveDemoModule }
					/>
				</Suspense>
			</Card.Content>
		</Card.Root>
	);
}

export const WithHostChrome: StoryObj = {
	render: () => <WidgetInHostChrome />,
	parameters: {
		docs: {
			description: {
				story: `
Chrome belongs to the host: the widget describes itself through metadata, and each host decides how (and whether) to frame it.

In this story the chrome is a \`Card\`: its header reads the type's metadata (\`icon\`, \`title\`) and the card body frames the widget render.

The diagonal stripes mark the chrome's area; the solid panel inside is the widget render. The widget renders no header of its own; another host could place the same metadata elsewhere, or skip it.
`,
			},
		},
	},
};

const demoWidgetTypeWithRelevance: WidgetType< DemoAttributes > = {
	...demoWidgetType,
	attributes: [
		{
			id: 'greeting',
			label: 'Greeting',
			type: 'text',
			isValid: { required: true },
		},
		{
			id: 'world',
			label: 'World',
			type: 'text',
			elements: WORLDS.map( ( { value, label } ) => ( {
				value,
				label,
			} ) ),
			relevance: 'high',
		},
	] satisfies WidgetAttributeField< DemoAttributes >[],
};

function WidgetWithRelevance() {
	const [ attributes, setAttributes ] = useState< DemoAttributes >( {
		...demoWidgetTypeWithRelevance.example?.attributes,
	} );

	const titleId = useId();
	// Hosts receive attributes already resolved by `useWidgetTypes`; the
	// story bypasses the hook, so it resolves them itself.
	const allFields = useMemo(
		() => resolveFields( demoWidgetTypeWithRelevance.attributes ?? [] ),
		[]
	);

	const prominentFields = useMemo(
		() =>
			allFields.filter(
				( field ) => field.relevance === 'high'
			) as Field< DemoAttributes >[],
		[ allFields ]
	);

	const hasSettingsSurface = allFields.some(
		( field ) => field.relevance !== 'high'
	);

	const prominentForm = useMemo< Form >(
		() => ( {
			layout: { type: 'row', alignment: 'center' },
			fields: prominentFields.map( ( field ) => ( {
				id: field.id,
				layout: { type: 'regular', labelPosition: 'none' },
			} ) ),
		} ),
		[ prominentFields ]
	);

	const settingsForm = useMemo< Form >(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: allFields.map( ( field ) => field.id ),
		} ),
		[ allFields ]
	);

	const applyEdits = ( edits: Partial< DemoAttributes > ) =>
		setAttributes( ( prev ) => ( { ...prev, ...edits } ) );

	return (
		<div
			style={ {
				alignItems: 'start',
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-xl)',
				gridTemplateColumns: hasSettingsSurface ? '2fr 1fr' : '1fr',
				maxWidth: 960,
			} }
		>
			<Card.Root
				render={ <section /> }
				aria-labelledby={ titleId }
				style={ {
					background: `repeating-linear-gradient(
						45deg,
						var(--wpds-color-background-surface-neutral),
						var(--wpds-color-background-surface-neutral) 8px,
						var(--wpds-color-background-surface-neutral-weak) 8px,
						var(--wpds-color-background-surface-neutral-weak) 16px
					)`,
				} }
			>
				<Card.Header>
					<Stack direction="row" align="center" gap="sm">
						{ demoWidgetTypeWithRelevance.icon && (
							<span aria-hidden="true">
								<Icon
									icon={ demoWidgetTypeWithRelevance.icon }
								/>
							</span>
						) }
						<Card.Title
							id={ titleId }
							render={ <h3 /> }
							style={ { flexGrow: 1 } }
						>
							{ demoWidgetTypeWithRelevance.title }
						</Card.Title>

						{ prominentFields.length > 0 && (
							<DataForm< DemoAttributes >
								data={ attributes }
								fields={ prominentFields }
								form={ prominentForm }
								onChange={ applyEdits }
							/>
						) }
					</Stack>
				</Card.Header>
				<Card.Content>
					<Suspense fallback={ null }>
						<WidgetRender< DemoAttributes >
							widgetType={ demoWidgetTypeWithRelevance }
							attributes={ attributes }
							setAttributes={ applyEdits }
							resolveWidgetModule={ resolveDemoModule }
						/>
					</Suspense>
				</Card.Content>
			</Card.Root>

			{ hasSettingsSurface && (
				<aside
					aria-label="Settings surface"
					style={ {
						border: '1px solid var(--wpds-color-stroke-surface-neutral)',
						borderRadius: 'var(--wpds-border-radius-md)',
						padding: 'var(--wpds-dimension-padding-lg)',
					} }
				>
					<strong
						style={ {
							display: 'block',
							marginBottom: 'var(--wpds-dimension-gap-sm)',
						} }
					>
						Settings surface
					</strong>
					<DataForm< DemoAttributes >
						data={ attributes }
						fields={ allFields }
						form={ settingsForm }
						onChange={ applyEdits }
					/>
				</aside>
			) }
		</div>
	);
}

export const WithRelevance: StoryObj = {
	render: () => <WidgetWithRelevance />,
	parameters: {
		docs: {
			description: {
				story: `
Each attribute may carry a \`relevance\` hint (\`'high' | 'medium' | 'low'\`). The widget declares importance; the host chooses the surface. When absent, treat the hint as \`'low'\`.

**In this demo**

- \`world\` is \`relevance: 'high'\`. The host promotes it to a **prominent surface** beside the title.
- \`greeting\` has no hint (default \`'low'\`). It lives in the **settings surface** on the right.

**Takeaway**

When every attribute is \`'high'\`, a host need not expose a second settings surface. Another host could fold everything into one panel and still honor the contract.
`,
			},
		},
	},
};

/*
 * Edit control for the `rating` field type. Registered once below;
 * widgets then reference the type by name, never this component.
 */
function RatingEdit< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const value = Number( field.getValue( { item: data } ) ?? 0 );

	return (
		<Stack direction="row" align="center">
			{ [ 1, 2, 3, 4, 5 ].map( ( star ) => (
				<IconButton
					key={ star }
					label={ `Rate ${ star } of 5` }
					icon={ starFilled }
					variant="unstyled"
					onClick={ () =>
						onChange(
							field.setValue( { item: data, value: star } )
						)
					}
					style={ {
						cursor: 'pointer',
						fontSize: '1.5em',
						opacity: star <= value ? 1 : 0.25,
						padding: 0,
					} }
				/>
			) ) }
		</Stack>
	);
}

// The application registers the vocabulary once, before anything renders.
// First registration wins, so Storybook hot reloads are harmless.
registerFieldType( {
	name: 'rating',
	baseType: 'integer',
	Edit: RatingEdit,
} );

interface RatedAttributes {
	rating?: number;
}

function RatedWidget( { attributes }: WidgetRenderProps< RatedAttributes > ) {
	const rating = attributes?.rating ?? 0;

	return (
		<div
			style={ {
				background: 'var(--wpds-color-background-surface-neutral)',
				border: '1px solid var(--wpds-color-stroke-surface-neutral)',
				borderRadius: 'var(--wpds-border-radius-md)',
				color: 'var(--wpds-color-foreground-content-neutral)',
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-md)',
				justifyItems: 'center',
				padding: 'var(--wpds-dimension-padding-xl)',
			} }
		>
			<strong style={ { fontSize: '1.5em' } }>
				{ rating > 0 ? '⭐'.repeat( rating ) : 'Not rated yet' }
			</strong>
			<span>{ `Rated ${ rating } / 5 from the prominent surface.` }</span>
		</div>
	);
}

/*
 * The declarative payoff: the attribute references `rating` by name.
 * No Edit import, no component, pure data.
 */
const ratedWidgetType: WidgetType< RatedAttributes > = {
	apiVersion: 1,
	name: 'demo/rated',
	title: 'Rated',
	description: 'Declares its rating attribute by field type name.',
	icon: starFilled,
	renderModule: 'demo/widgets/rated/render',
	attributes: [
		{
			id: 'rating',
			type: 'rating',
			label: 'Rating',
			relevance: 'high',
		},
	] satisfies WidgetAttributeField< RatedAttributes >[],
	example: {
		attributes: { rating: 3 },
	},
};

const resolveRatedModule = async () => ( {
	default: RatedWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

function WidgetWithFieldType() {
	const [ attributes, setAttributes ] = useState< RatedAttributes >( {
		...ratedWidgetType.example?.attributes,
	} );

	const titleId = useId();

	// Hosts receive attributes already resolved by `useWidgetTypes`; the
	// story bypasses the hook, so it resolves them itself.
	const prominentFields = useMemo(
		() =>
			resolveFields( ratedWidgetType.attributes ?? [] ).filter(
				( field ) => field.relevance === 'high'
			) as Field< RatedAttributes >[],
		[]
	);

	const prominentForm = useMemo< Form >(
		() => ( {
			layout: { type: 'row', alignment: 'center' },
			fields: prominentFields.map( ( field ) => ( {
				id: field.id,
				layout: { type: 'regular', labelPosition: 'none' },
			} ) ),
		} ),
		[ prominentFields ]
	);

	const applyEdits = ( edits: Partial< RatedAttributes > ) =>
		setAttributes( ( prev ) => ( { ...prev, ...edits } ) );

	return (
		<div style={ { maxWidth: 560 } }>
			<Card.Root
				render={ <section /> }
				aria-labelledby={ titleId }
				style={ {
					background: `repeating-linear-gradient(
						45deg,
						var(--wpds-color-background-surface-neutral),
						var(--wpds-color-background-surface-neutral) 8px,
						var(--wpds-color-background-surface-neutral-weak) 8px,
						var(--wpds-color-background-surface-neutral-weak) 16px
					)`,
				} }
			>
				<Card.Header>
					<Stack direction="row" align="center" gap="sm">
						{ ratedWidgetType.icon && (
							<span aria-hidden="true">
								<Icon icon={ ratedWidgetType.icon } />
							</span>
						) }
						<Card.Title
							id={ titleId }
							render={ <h3 /> }
							style={ { flexGrow: 1 } }
						>
							{ ratedWidgetType.title }
						</Card.Title>

						<DataForm< RatedAttributes >
							data={ attributes }
							fields={ prominentFields }
							form={ prominentForm }
							onChange={ applyEdits }
						/>
					</Stack>
				</Card.Header>
				<Card.Content>
					<Suspense fallback={ null }>
						<WidgetRender< RatedAttributes >
							widgetType={ ratedWidgetType }
							attributes={ attributes }
							setAttributes={ applyEdits }
							resolveWidgetModule={ resolveRatedModule }
						/>
					</Suspense>
				</Card.Content>
			</Card.Root>
		</div>
	);
}

export const WithFieldType: StoryObj = {
	render: () => <WidgetWithFieldType />,
	parameters: {
		docs: {
			description: {
				story: `
The attribute references a **field type** by name instead of carrying a control:

1. The application registers \`rating\` once (\`registerFieldType\`), binding the name to \`baseType: 'integer'\` plus a star-rating \`Edit\` control.
2. The widget declares \`{ id: 'rating', type: 'rating', relevance: 'high' }\`. Pure data: no imports, no components.
3. The host resolves the schema (hosts get this through \`useWidgetTypes\`; the story calls the resolver itself) and promotes the field to the prominent surface, where the registered control renders.

An unregistered name would degrade silently, exactly like an unknown type in DataViews. See the **Field Types** doc for the full pipeline.
`,
			},
		},
	},
};

const actionsWidgetType: WidgetType< DemoAttributes > = {
	...demoWidgetType,
	actions: [
		{
			id: 'open-docs',
			label: 'Open docs',
			href: 'https://developer.wordpress.org/',
			openInNewTab: true,
		},
		{
			id: 'export-greeting',
			label: 'Export greeting',
			href: new URL( './greeting.txt', import.meta.url ).href,
			download: 'greeting.txt',
		},
	] satisfies WidgetAction[],
};

function WidgetWithActions() {
	const titleId = useId();
	const actions = actionsWidgetType.actions ?? [];
	const [ attributes ] = useState< DemoAttributes >( {
		...actionsWidgetType.example?.attributes,
	} );

	return (
		<div style={ { maxWidth: 560 } }>
			<Card.Root render={ <section /> } aria-labelledby={ titleId }>
				<Card.Header>
					<Stack direction="row" align="center" gap="sm">
						{ actionsWidgetType.icon && (
							<span aria-hidden="true">
								<Icon icon={ actionsWidgetType.icon } />
							</span>
						) }
						<Card.Title
							id={ titleId }
							render={ <h3 /> }
							style={ { flexGrow: 1 } }
						>
							{ actionsWidgetType.title }
						</Card.Title>

						{ /* The host materializes the declared actions; here, as links. */ }
						<Stack direction="row" align="center" gap="md">
							{ actions.map( ( action ) => (
								<Link
									key={ action.id }
									href={ action.href }
									download={ action.download }
									openInNewTab={ action.openInNewTab }
								>
									{ action.label }
								</Link>
							) ) }
						</Stack>
					</Stack>
				</Card.Header>
				<Card.Content>
					<Suspense fallback={ null }>
						<WidgetRender< DemoAttributes >
							widgetType={ actionsWidgetType }
							attributes={ attributes }
							resolveWidgetModule={ resolveDemoModule }
						/>
					</Suspense>
				</Card.Content>
			</Card.Root>
		</div>
	);
}

export const WithActions: StoryObj = {
	render: () => <WidgetWithActions />,
	parameters: {
		docs: {
			description: {
				story: `
Beyond its data, a widget can declare \`actions\`: verbs a user can trigger, like opening docs or downloading a file. The widget names each action (\`id\`, \`label\`) and how it is fulfilled, through the key it writes (today a link \`href\`); the host mounts the primitive and decides where to put it.

**In this demo**

- The widget declares two actions: an external link (\`Open docs\`) and a download (\`Export greeting\`).
- The host renders them as links beside the title. Another host could surface them in a menu, a footer, or a command palette.

**Takeaway**

The widget names the intent and how it is fulfilled; the host mounts the primitive and places it, so the widget never knows its surface.
`,
			},
		},
	},
};

/*
 * The demo application's router. The link and the capability are module
 * constants: the provider memoizes on the value's identity, so a fresh
 * object per render would remount every anchor below it.
 */
const DEMO_ROUTE_PREFIX = 'admin.php?page=demo-dashboard&p=';
const DEMO_NAVIGATE_EVENT = 'wp-widget-primitives-demo-navigate';

const RouteLink = forwardRef<
	HTMLAnchorElement,
	{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >
>( function RouteLink( { path, onClick, children, ...props }, ref ) {
	return (
		<a
			ref={ ref }
			href={ path }
			{ ...props }
			onClick={ ( event ) => {
				onClick?.( event );
				event.preventDefault();
				window.dispatchEvent(
					new CustomEvent( DEMO_NAVIGATE_EVENT, { detail: path } )
				);
			} }
		>
			{ children }
		</a>
	);
} );

const demoLinks: WidgetHostLinks = {
	match: ( href ) =>
		href.startsWith( DEMO_ROUTE_PREFIX )
			? decodeURIComponent( href.slice( DEMO_ROUTE_PREFIX.length ) )
			: null,
	Link: RouteLink,
};

const DEMO_HOST: WidgetHost = { links: demoLinks };
const NO_CAPABILITIES: WidgetHost = {};

const hostLinkWidgetType: WidgetType< DemoAttributes > = {
	...demoWidgetType,
	actions: [
		{
			id: 'see-report',
			label: 'See report',
			href: `${ DEMO_ROUTE_PREFIX }${ encodeURIComponent(
				'/reports?by=world'
			) }`,
		},
		...( actionsWidgetType.actions ?? [] ),
	] satisfies WidgetAction[],
};

function WidgetWithHostLink() {
	const titleId = useId();
	const actions = hostLinkWidgetType.actions ?? [];
	const [ hasCapability, setHasCapability ] = useState( true );
	const [ lastPath, setLastPath ] = useState< string | null >( null );
	const [ attributes ] = useState< DemoAttributes >( {
		...hostLinkWidgetType.example?.attributes,
	} );

	useEffect( () => {
		const onNavigate = ( event: Event ) =>
			setLastPath( ( event as CustomEvent< string > ).detail );

		window.addEventListener( DEMO_NAVIGATE_EVENT, onNavigate );
		return () =>
			window.removeEventListener( DEMO_NAVIGATE_EVENT, onNavigate );
	}, [] );

	let status = 'Pick "See report": its target is a route this host owns.';
	if ( ! hasCapability ) {
		status = 'No links capability: every action is a plain anchor.';
	} else if ( lastPath ) {
		status = `Client-side navigation to ${ lastPath }; the document never reloaded.`;
	}

	return (
		<WidgetHostProvider
			value={ hasCapability ? DEMO_HOST : NO_CAPABILITIES }
		>
			<Stack direction="column" gap="md" style={ { maxWidth: 560 } }>
				<Stack direction="row" align="center" gap="md" wrap="wrap">
					<Button
						variant="outline"
						size="compact"
						onClick={ () => {
							setHasCapability( ! hasCapability );
							setLastPath( null );
						} }
					>
						{ hasCapability
							? 'Remove the capability'
							: 'Provide the capability' }
					</Button>
					<p
						role="status"
						style={ {
							margin: 0,
							color: 'var(--wpds-color-foreground-content-neutral-weak)',
							fontSize: 'var(--wpds-typography-font-size-sm)',
						} }
					>
						{ status }
					</p>
				</Stack>

				<Card.Root render={ <section /> } aria-labelledby={ titleId }>
					<Card.Header>
						<Stack direction="column" gap="sm">
							<Stack direction="row" align="center" gap="sm">
								{ hostLinkWidgetType.icon && (
									<span aria-hidden="true">
										<Icon
											icon={ hostLinkWidgetType.icon }
										/>
									</span>
								) }
								<Card.Title id={ titleId } render={ <h3 /> }>
									{ hostLinkWidgetType.title }
								</Card.Title>
							</Stack>

							{ /* One composition per action, whatever the target. */ }
							<Stack
								direction="row"
								align="center"
								gap="md"
								wrap="wrap"
							>
								{ actions.map( ( action ) => (
									<Link
										key={ action.id }
										download={ action.download }
										openInNewTab={ action.openInNewTab }
										render={
											<HostLink href={ action.href } />
										}
									>
										{ action.label }
									</Link>
								) ) }
							</Stack>
						</Stack>
					</Card.Header>
					<Card.Content>
						<Suspense fallback={ null }>
							<WidgetRender< DemoAttributes >
								widgetType={ hostLinkWidgetType }
								attributes={ attributes }
								resolveWidgetModule={ resolveDemoModule }
							/>
						</Suspense>
					</Card.Content>
				</Card.Root>
			</Stack>
		</WidgetHostProvider>
	);
}

export const WithHostLink: StoryObj = {
	render: () => <WidgetWithHostLink />,
	parameters: {
		docs: {
			description: {
				story: `
The widget declares where to go; the application decides how to get there. \`HostLink\` is the anchor that carries the decision: it reads the \`links\` capability, mounts the application's own link for a target \`match\` recognizes, and a plain anchor for everything else.

**In this demo**

- The host provides a router that owns \`admin.php?page=demo-dashboard&p=…\`. "See report" targets one of its routes, so it navigates client-side and the status line records the path; the document never reloads.
- "Open docs" opens another origin in a new tab and "Export greeting" downloads a file. Neither routes: a new document leaves the application, so \`HostLink\` keeps the plain anchor without asking the host.
- **Remove the capability** drops \`links\` from the host bag. The declarations do not change, and every action falls back to a plain anchor.

**Takeaway**

Consumers write one composition, \`render={ <HostLink href={ action.href } /> }\` on their UI link, and never branch on the capability themselves. \`Link\`, \`LinkButton\` and \`Menu.LinkItem\` take the same anchor props, so the same line serves all three.
`,
			},
		},
	},
};

/*
 * The application's icon vocabulary: one resolver, registered once.
 * Records reference icons by name; the resolver returns elements.
 */
const STORY_ICONS: Record< string, WidgetIcon > = {
	'demo/planet': globe,
};

registerIconResolver( async ( reference ) => STORY_ICONS[ reference ] ?? null );

const referencedIconWidgetType: WidgetType< DemoAttributes > = {
	...demoWidgetType,
	icon: undefined,
};

function WidgetWithIconReference() {
	const titleId = useId();
	const [ attributes ] = useState< DemoAttributes >( {
		...referencedIconWidgetType.example?.attributes,
	} );
	const [ icon, setIcon ] = useState< WidgetIcon | null >( null );

	// Hosts get the resolved icon through `useWidgetTypes`; the story
	// resolves the reference itself.
	useEffect( () => {
		let cancelled = false;
		void resolveIcon( 'demo/planet' ).then( ( resolved ) => {
			if ( ! cancelled ) {
				setIcon( resolved );
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [] );

	return (
		<div style={ { maxWidth: 560 } }>
			<Card.Root render={ <section /> } aria-labelledby={ titleId }>
				<Card.Header>
					<Stack direction="row" align="center" gap="sm">
						{ icon && (
							<span aria-hidden="true">
								<Icon icon={ icon } />
							</span>
						) }
						<Card.Title
							id={ titleId }
							render={ <h3 /> }
							style={ { flexGrow: 1 } }
						>
							{ referencedIconWidgetType.title }
						</Card.Title>
					</Stack>
				</Card.Header>
				<Card.Content>
					<Suspense fallback={ null }>
						<WidgetRender< DemoAttributes >
							widgetType={ referencedIconWidgetType }
							attributes={ attributes }
							resolveWidgetModule={ resolveDemoModule }
						/>
					</Suspense>
				</Card.Content>
			</Card.Root>
		</div>
	);
}

export const WithIconReference: StoryObj = {
	render: () => <WidgetWithIconReference />,
	parameters: {
		docs: {
			description: {
				story: `
The widget declares its icon as a **registered icon name** instead of a rendered element:

1. The application registers one **icon resolver** (\`registerIconResolver\`), closing over its icon source. On WordPress that source is the \`icon\` REST entity; here, a local catalog.
2. The widget declares \`"icon": "demo/planet"\` in \`widget.json\`. Pure data: no imports, no elements.
3. \`useWidgetTypes\` resolves the reference while assembling each \`WidgetType\` (the story calls the resolver itself), so the host receives a renderable element and never sees the name.

An unresolvable reference degrades to no icon. See the **Icons** doc for the full pipeline.
`,
			},
		},
	},
};
