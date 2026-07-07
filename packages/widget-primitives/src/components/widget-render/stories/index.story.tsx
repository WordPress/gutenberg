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
import { DataForm, useFormValidity } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { Suspense, useId, useMemo, useState } from '@wordpress/element';
import { globe } from '@wordpress/icons';
import { Card, Icon, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { WidgetRender } from '..';
import type { WidgetRenderProps, WidgetType } from '../../../types';

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
	title: 'Widget Primitives/WidgetRender',
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
