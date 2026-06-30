import type { Decorator } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 60;

const labelStyles: CSSProperties = {
	fontSize: 'var(--wpds-typography-font-size-xs)',
	fontWeight: 'var(--wpds-typography-font-weight-medium)',
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
	textTransform: 'uppercase',
	marginBlockEnd: 'var(--wpds-dimension-gap-xs)',
};

const cssStyles: CSSProperties = {
	fontSize: 'var(--wpds-typography-font-size-xs)',
	fontFamily: 'monospace',
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
	marginBlockEnd: 'var(--wpds-dimension-gap-sm)',
};

const constraintOutline: CSSProperties = {
	outline: '1px dashed var(--wpds-color-stroke-surface-neutral-weak)',
};

type Scenario = {
	name: string;
	css: string;
	fullWidth?: boolean;
	render: ( story: ReactNode, width: number, height: number ) => ReactNode;
};

const scenarios: Scenario[] = [
	{
		name: 'Unconstrained',
		css: 'No width constraint',
		fullWidth: true,
		render: ( story ) => story,
	},
	{
		name: 'Fixed width',
		css: 'width: {w}px',
		render: ( story, w ) => (
			<div style={ { ...constraintOutline, width: w } }>{ story }</div>
		),
	},
	{
		name: 'Max-width',
		css: 'max-width: {w}px',
		render: ( story, w ) => (
			<div style={ { ...constraintOutline, maxWidth: w } }>{ story }</div>
		),
	},
	{
		name: 'Fit-content',
		css: 'width: fit-content',
		render: ( story ) => (
			<div style={ { ...constraintOutline, width: 'fit-content' } }>
				{ story }
			</div>
		),
	},
	{
		name: 'Flex child (default)',
		css: 'Flex parent width: {w}px',
		render: ( story, w ) => (
			<div
				style={ {
					...constraintOutline,
					display: 'flex',
					width: w,
				} }
			>
				{ story }
			</div>
		),
	},
	{
		name: 'Flex child (min-width: 0)',
		css: 'Flex parent width: {w}px; child min-width: 0',
		render: ( story, w ) => (
			<div
				style={ {
					...constraintOutline,
					display: 'flex',
					width: w,
				} }
			>
				<div style={ { minWidth: 0 } }>{ story }</div>
			</div>
		),
	},
	{
		name: 'Flex child with siblings',
		css: 'Children: flex: 1; min-width: 0',
		render: ( story ) => (
			<div
				style={ {
					...constraintOutline,
					display: 'flex',
					gap: 8,
				} }
			>
				<div style={ { flex: '1 1 0', minWidth: 0 } }>{ story }</div>
				<div
					style={ {
						flex: '1 1 0',
						minWidth: 0,
						background: '#f0f0f0',
						borderRadius: 2,
					} }
				/>
			</div>
		),
	},
	{
		name: 'Grid (fixed column)',
		css: 'grid-template-columns: {w}px',
		render: ( story, w ) => (
			<div
				style={ {
					...constraintOutline,
					display: 'grid',
					gridTemplateColumns: `${ w }px`,
				} }
			>
				{ story }
			</div>
		),
	},
	{
		name: 'Grid (min-content column)',
		css: 'width: {w}px; grid-template-columns: min-content 1fr',
		render: ( story, w ) => (
			<div
				style={ {
					...constraintOutline,
					display: 'grid',
					gridTemplateColumns: 'min-content 1fr',
					gap: 8,
					width: w,
				} }
			>
				{ story }
				<div
					style={ {
						background: '#f0f0f0',
						borderRadius: 2,
					} }
				/>
			</div>
		),
	},
	{
		name: 'Fixed width + height',
		css: 'width: {w}px; height: {h}px',
		render: ( story, w, h ) => (
			<div style={ { ...constraintOutline, width: w, height: h } }>
				{ story }
			</div>
		),
	},
	{
		name: 'overflow: hidden',
		css: 'width: {w}px; overflow: hidden',
		render: ( story, w ) => (
			<div
				style={ {
					...constraintOutline,
					width: w,
					overflow: 'hidden',
				} }
			>
				{ story }
			</div>
		),
	},
];

export const WithTextOverflowContainers: Decorator = ( Story, context ) => {
	const param = context.parameters?.textOverflowContainers;

	if ( ! param ) {
		return <Story { ...context } />;
	}

	const width =
		( typeof param === 'object' ? param.width : undefined ) ??
		DEFAULT_WIDTH;
	const height =
		( typeof param === 'object' ? param.height : undefined ) ??
		DEFAULT_HEIGHT;

	const formatCss = ( css: string ) =>
		css
			.replace( /\{w\}/g, String( width ) )
			.replace( /\{h\}/g, String( height ) );

	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
				gap: 24,
			} }
		>
			{ scenarios.map( ( scenario ) => (
				<div
					key={ scenario.name }
					style={
						scenario.fullWidth
							? { gridColumn: '1 / -1' }
							: undefined
					}
				>
					<div style={ labelStyles }>{ scenario.name }</div>
					<div style={ cssStyles }>{ formatCss( scenario.css ) }</div>
					{ scenario.render(
						<Story { ...context } />,
						width,
						height
					) }
				</div>
			) ) }
		</div>
	);
};
