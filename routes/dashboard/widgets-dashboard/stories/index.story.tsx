/**
 * External dependencies
 */
import type { ComponentProps, ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type {
	ResolveWidgetModule,
	WidgetInstance,
	WidgetRenderProps,
	WidgetType,
} from '../types';

/*
 * Mock widget modules
 *
 * Widgets are resolved at render time via `resolveWidgetModule`. In
 * production this maps a script-module id to a React component; here we
 * keep it in-memory and introduce a small delay so the `Suspense`
 * fallback is observable.
 */

type HelloAttrs = { greeting: string };

function HelloWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< HelloAttrs > ) {
	return (
		<div
			style={ {
				padding: 16,
				height: '100%',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
				background: 'var(--wpds-color-bg-surface-brand)',
				color: 'var(--wpds-color-fg-content-neutral)',
				borderRadius: 8,
			} }
		>
			<strong>Hello widget</strong>
			<p style={ { margin: 0 } }>{ attributes.greeting }</p>
			<input
				type="text"
				value={ attributes.greeting }
				onChange={ ( event ) =>
					setAttributes?.( { greeting: event.target.value } )
				}
				aria-label="Greeting"
				style={ { padding: 4 } }
			/>
		</div>
	);
}

type CounterAttrs = { count: number };

function CounterWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< CounterAttrs > ) {
	return (
		<div
			style={ {
				padding: 16,
				height: '100%',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
				background: 'var(--wpds-color-bg-surface-info)',
				color: 'var(--wpds-color-fg-content-neutral)',
				borderRadius: 8,
			} }
		>
			<strong>Counter widget</strong>
			<p style={ { margin: 0, fontSize: 24 } }>{ attributes.count }</p>
			<button
				onClick={ () =>
					setAttributes?.( { count: attributes.count + 1 } )
				}
			>
				Increment
			</button>
		</div>
	);
}

function StaticWidget() {
	return (
		<div
			style={ {
				padding: 16,
				height: '100%',
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'var(--wpds-color-bg-surface-neutral)',
				color: 'var(--wpds-color-fg-content-neutral)',
				border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
				borderRadius: 8,
			} }
		>
			Static content
		</div>
	);
}

const MOCK_MODULES: Record< string, { default: ComponentType< any > } > = {
	'mock/hello': { default: HelloWidget },
	'mock/counter': { default: CounterWidget },
	'mock/static': { default: StaticWidget },
};

const resolveWidgetModule: ResolveWidgetModule = ( moduleId ) =>
	new Promise( ( resolve, reject ) => {
		setTimeout( () => {
			const mod = MOCK_MODULES[ moduleId ];
			if ( ! mod ) {
				reject( new Error( `Unknown mock module: ${ moduleId }` ) );
				return;
			}
			resolve( mod );
		}, 200 );
	} );

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'mock/hello',
		title: 'Hello',
		renderModule: 'mock/hello',
		example: { attributes: { greeting: 'Hi there' } },
	},
	{
		apiVersion: 1,
		name: 'mock/counter',
		title: 'Counter',
		renderModule: 'mock/counter',
		example: { attributes: { count: 0 } },
	},
	{
		apiVersion: 1,
		name: 'mock/static',
		title: 'Static',
		renderModule: 'mock/static',
	},
];

const defaultLayout: WidgetInstance[] = [
	{
		uuid: 'w1',
		type: 'mock/hello',
		attributes: { greeting: 'Good morning' },
		placement: { width: 2, height: 2 },
	},
	{
		uuid: 'w2',
		type: 'mock/counter',
		attributes: { count: 3 },
		placement: { width: 2, height: 2 },
	},
	{
		uuid: 'w3',
		type: 'mock/static',
		placement: { width: 'fill', height: 2 },
	},
	{
		uuid: 'w4',
		type: 'mock/static',
		placement: { width: 'full', height: 1 },
	},
];

function StatefulDashboard( props: ComponentProps< typeof WidgetDashboard > ) {
	const [ layout, setLayout ] = useState( props.layout );

	return (
		<div style={ { padding: 16 } }>
			<WidgetDashboard
				{ ...props }
				layout={ layout }
				onLayoutChange={ ( next ) => {
					setLayout( next );
					props.onLayoutChange?.( next );
				} }
			/>
		</div>
	);
}

const meta: Meta< typeof WidgetDashboard > = {
	title: 'Dashboard/WidgetDashboard',
	component: WidgetDashboard,
	render: ( args ) => <StatefulDashboard { ...args } />,
	args: {
		widgetTypes,
		resolveWidgetModule,
		editMode: false,
		grid: { columns: 6, spacing: 2, rowHeight: 120 },
	},
	argTypes: {
		children: { control: false },
		layout: { control: false },
		widgetTypes: { control: false },
		resolveWidgetModule: { control: false },
		grid: { control: false },
		onLayoutChange: { action: 'onLayoutChange' },
		onEditChange: { action: 'onEditChange' },
		editMode: { control: { type: 'boolean' } },
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

type Story = StoryObj< typeof WidgetDashboard >;

export const Default: Story = {
	args: {
		layout: defaultLayout,
	},
};

export const EditMode: Story = {
	args: {
		layout: defaultLayout,
		editMode: true,
	},
};

export const Empty: Story = {
	args: {
		layout: [],
		children: (
			<>
				<WidgetDashboard.Empty>
					<div
						style={ {
							padding: 48,
							textAlign: 'center',
							color: 'var(--wpds-color-fg-content-neutral-weak)',
						} }
					>
						No widgets added.
					</div>
				</WidgetDashboard.Empty>
				<WidgetDashboard.Widgets />
			</>
		),
	},
};

export const Responsive: Story = {
	args: {
		layout: defaultLayout,
		grid: { minColumnWidth: 220, spacing: 2, rowHeight: 120 },
	},
};
