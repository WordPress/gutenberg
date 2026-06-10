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
import { wordpress } from '@wordpress/icons';
import { Card, Icon, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { WidgetRender } from '..';
import type { WidgetRenderProps, WidgetType } from '../../../types';

/*
 * In WordPress, a widget's metadata and render component live in a
 * `widgets/<name>/` folder and reach the client through the build manifest,
 * the server registry, and `useWidgetTypes()`. Stories run without
 * WordPress, so both halves are declared inline and injected: the type
 * through the `widgetType` prop, the component through
 * `resolveWidgetModule`.
 */

interface DemoAttributes {
	message?: string;
	tone?: 'neutral' | 'info' | 'caution';
}

const TONES: NonNullable< DemoAttributes[ 'tone' ] >[] = [
	'neutral',
	'info',
	'caution',
];

const TONE_BACKGROUND: Record< string, string > = {
	neutral: 'var(--wpds-color-bg-surface-neutral)',
	info: 'var(--wpds-color-bg-surface-info-weak)',
	caution: 'var(--wpds-color-bg-surface-caution-weak)',
};

function DemoWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< DemoAttributes > ) {
	const { message = 'Hello World', tone = 'neutral' } = attributes ?? {};

	return (
		<div
			style={ {
				background: TONE_BACKGROUND[ tone ],
				border: '1px solid var(--wpds-color-stroke-surface-neutral)',
				borderRadius: 'var(--wpds-border-radius-md)',
				color: 'var(--wpds-color-fg-content-neutral)',
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-md)',
				justifyItems: 'center',
				padding: 'var(--wpds-dimension-padding-xl)',
			} }
		>
			<strong style={ { fontSize: '1.5em' } }>{ message }</strong>
			{ setAttributes && (
				<button
					onClick={ () =>
						setAttributes( {
							tone: TONES[
								( TONES.indexOf( tone ) + 1 ) % TONES.length
							],
						} )
					}
				>
					Cycle tone
				</button>
			) }
		</div>
	);
}

/*
 * The authoring shape: `attributes` is a dataviews `Field[]`, so a host can
 * mount a settings form straight from the type with no per-widget wiring.
 */
const demoWidgetType: WidgetType< DemoAttributes > = {
	apiVersion: 1,
	name: 'demo/hello-world',
	title: 'Hello World',
	description: 'Minimal widget demonstrating the render contract.',
	icon: wordpress,
	renderModule: 'demo/widgets/hello-world/render',
	attributes: [
		{
			id: 'message',
			label: 'Message',
			type: 'text',
			isValid: { required: true },
		},
		{
			id: 'tone',
			label: 'Tone',
			type: 'text',
			elements: TONES.map( ( tone ) => ( {
				value: tone,
				label: tone,
			} ) ),
		},
	] as Field< DemoAttributes >[],
	example: {
		attributes: { message: 'Hello World', tone: 'info' },
	},
};

// What `import( widget.renderModule )` resolves to on a WordPress page.
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
				component:
					'Host-agnostic entry point that renders a widget type. The host provides the `WidgetType` (on a WordPress page it arrives through `useWidgetTypes()`), a `resolveWidgetModule` to load the render component, and optionally `setAttributes`. These stories run outside WordPress, so both halves are declared inline and injected.',
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
				story: 'The render contract: `attributes` flow into the widget, and the widget writes back through `setAttributes` (the internal "Cycle tone" button). Suspense is a host concern: the primitive resolves the module with `lazy()` and the host decides the loading UI.',
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
				story: 'A widget type declares its settings as dataviews `Field[]` in `attributes`. The host mounts a `DataForm` directly from that schema, with no per-widget form wiring, and the edited attributes flow into the rendered widget. Any host can build its settings surface this way.',
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
			style={ { maxWidth: 480 } }
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

/*
 * Chrome belongs to the host: it reads the type's metadata and frames the
 * render however it wants. In this story, a Card header.
 */
export const WithHostChrome: StoryObj = {
	render: () => <WidgetInHostChrome />,
	parameters: {
		docs: {
			description: {
				story: "Chrome belongs to the host. In this story, the widget doesn't declare its own header: the chrome is a `Card` whose header stacks the type's metadata (`icon`, `title`), and the card body frames the widget render.",
			},
		},
	},
};
