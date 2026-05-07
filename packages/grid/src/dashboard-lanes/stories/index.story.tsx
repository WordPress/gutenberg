/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DashboardLanes } from '..';
import type { DashboardLanesLayoutItem } from '../types';

const meta: Meta< typeof DashboardLanes > = {
	title: 'Grid/DashboardLanes',
	component: DashboardLanes,
	tags: [ 'status-experimental' ],
	args: {
		columns: 4,
		spacing: 2,
		flowTolerance: 16,
		rowUnit: 4,
		editMode: false,
	},
	argTypes: {
		children: { control: false },
		columns: {
			control: { type: 'number', min: 1, max: 12, step: 1 },
			description: 'Total lanes in fixed mode.',
		},
		minColumnWidth: {
			control: { type: 'number', min: 80, max: 600, step: 8 },
			description:
				'Enables responsive mode. Per-lane lower bound in pixels.',
		},
		spacing: {
			control: { type: 'number', min: 0, max: 16, step: 1 },
			description: 'Gap multiplier (effective gap = spacing × 4px).',
		},
		flowTolerance: {
			control: { type: 'number', min: 0, max: 64, step: 1 },
			description:
				'Pixel tolerance for source-order tiebreaking when two lanes have similar baselines.',
		},
		rowUnit: {
			control: { type: 'number', min: 1, max: 16, step: 1 },
			description:
				'Polyfill snap unit (px). Ignored on browsers with native `display: grid-lanes` support.',
		},
		editMode: {
			control: { type: 'boolean' },
			description: 'Enables drag-to-reorder and horizontal resize.',
		},
		onChangeLayout: { action: 'onChangeLayout' },
		onPreviewLayout: { action: 'onPreviewLayout' },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'This package is under heavy development and likely to change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof DashboardLanes >;

type Tone = 'brand' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

const bgTokens: Record< Tone, string > = {
	brand: 'var(--wpds-color-bg-surface-brand)',
	info: 'var(--wpds-color-bg-surface-info)',
	success: 'var(--wpds-color-bg-surface-success)',
	warning: 'var(--wpds-color-bg-surface-warning)',
	error: 'var(--wpds-color-bg-surface-error)',
	neutral: 'var(--wpds-color-bg-surface-neutral-weak)',
};

const fgTokens: Record< Tone, string > = {
	brand: 'var(--wpds-color-fg-content-info)',
	info: 'var(--wpds-color-fg-content-info)',
	success: 'var(--wpds-color-fg-content-success)',
	warning: 'var(--wpds-color-fg-content-warning)',
	error: 'var(--wpds-color-fg-content-error)',
	neutral: 'var(--wpds-color-fg-content-neutral)',
};

function Tile( {
	tone,
	height,
	children,
	...props
}: {
	tone: Tone;
	height: number;
	children: React.ReactNode;
} & React.HTMLAttributes< HTMLDivElement > ) {
	return (
		<div
			{ ...props }
			style={ {
				backgroundColor: bgTokens[ tone ],
				color: fgTokens[ tone ],
				padding: '16px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height,
				boxSizing: 'border-box',
				fontFamily: 'var(--wpds-typography-font-family-body)',
				fontSize: 'var(--wpds-typography-font-size-sm)',
				borderRadius: 6,
				...props?.style,
			} }
		>
			{ children }
		</div>
	);
}

/**
 * Mixed-height tiles in a fixed lane count. Items pack from
 * left-to-right by source order, falling into whichever lane has
 * the lowest baseline at the moment of placement.
 */
export const Default: Story = {
	args: {
		columns: 4,
		layout: [
			{ key: 'a' },
			{ key: 'b' },
			{ key: 'c' },
			{ key: 'd' },
			{ key: 'e' },
			{ key: 'f' },
			{ key: 'g' },
			{ key: 'h' },
		],
		children: [
			<Tile key="a" tone="brand" height={ 120 }>
				A · 120px
			</Tile>,
			<Tile key="b" tone="info" height={ 200 }>
				B · 200px
			</Tile>,
			<Tile key="c" tone="success" height={ 80 }>
				C · 80px
			</Tile>,
			<Tile key="d" tone="warning" height={ 160 }>
				D · 160px
			</Tile>,
			<Tile key="e" tone="error" height={ 100 }>
				E · 100px
			</Tile>,
			<Tile key="f" tone="neutral" height={ 240 }>
				F · 240px
			</Tile>,
			<Tile key="g" tone="brand" height={ 140 }>
				G · 140px
			</Tile>,
			<Tile key="h" tone="info" height={ 90 }>
				H · 90px
			</Tile>,
		],
	},
};

/**
 * Responsive lane count: derived from container width using
 * `minColumnWidth` as the per-lane lower bound. Resize the preview
 * frame to see the lane count adapt.
 */
export const Responsive: Story = {
	args: {
		minColumnWidth: 200,
		layout: [
			{ key: 'a' },
			{ key: 'b' },
			{ key: 'c' },
			{ key: 'd' },
			{ key: 'e' },
			{ key: 'f' },
		],
		children: [
			<Tile key="a" tone="brand" height={ 120 }>
				A
			</Tile>,
			<Tile key="b" tone="info" height={ 200 }>
				B
			</Tile>,
			<Tile key="c" tone="success" height={ 80 }>
				C
			</Tile>,
			<Tile key="d" tone="warning" height={ 160 }>
				D
			</Tile>,
			<Tile key="e" tone="error" height={ 100 }>
				E
			</Tile>,
			<Tile key="f" tone="neutral" height={ 240 }>
				F
			</Tile>,
		],
	},
};

/**
 * Items with `width: 2` span two lanes. The skyline picks a span
 * position that minimizes the resulting baseline across spanned
 * lanes.
 */
export const Spanning: Story = {
	args: {
		columns: 4,
		layout: [
			{ key: 'a' },
			{ key: 'wide', width: 2 },
			{ key: 'b' },
			{ key: 'c' },
			{ key: 'd' },
			{ key: 'taller-wide', width: 2 },
			{ key: 'e' },
		],
		children: [
			<Tile key="a" tone="brand" height={ 120 }>
				A
			</Tile>,
			<Tile key="wide" tone="info" height={ 100 }>
				wide · span 2
			</Tile>,
			<Tile key="b" tone="success" height={ 80 }>
				B
			</Tile>,
			<Tile key="c" tone="warning" height={ 200 }>
				C
			</Tile>,
			<Tile key="d" tone="error" height={ 90 }>
				D
			</Tile>,
			<Tile key="taller-wide" tone="neutral" height={ 160 }>
				taller-wide · span 2
			</Tile>,
			<Tile key="e" tone="brand" height={ 110 }>
				E
			</Tile>,
		],
	},
};

/**
 * Edit mode: drag to reorder, resize from the bottom-right corner
 * (horizontal only — heights are content-driven). Drop commits the
 * new layout via `onChangeLayout`.
 */
export const EditMode: Story = {
	args: {
		columns: 4,
		spacing: 2,
		editMode: true,
	},
	render: function EditModeStory( args ) {
		const initial: ( DashboardLanesLayoutItem & {
			tone: Tone;
			height: number;
			label: string;
		} )[] = [
			{ key: 'a', tone: 'brand', height: 120, label: 'A · 120px' },
			{ key: 'b', tone: 'info', height: 200, label: 'B · 200px' },
			{
				key: 'wide',
				width: 2,
				tone: 'success',
				height: 100,
				label: 'wide · span 2',
			},
			{ key: 'c', tone: 'warning', height: 160, label: 'C · 160px' },
			{ key: 'd', tone: 'error', height: 90, label: 'D · 90px' },
			{ key: 'e', tone: 'neutral', height: 240, label: 'E · 240px' },
			{ key: 'f', tone: 'brand', height: 140, label: 'F · 140px' },
		];

		const [ tiles, setTiles ] = useState( initial );

		const layout: DashboardLanesLayoutItem[] = tiles.map(
			( { tone: _tone, height: _height, label: _label, ...item } ) => item
		);

		const onChangeLayout = ( next: DashboardLanesLayoutItem[] ) => {
			setTiles(
				next.map( ( item ) => {
					const existing = tiles.find( ( t ) => t.key === item.key );
					return {
						...item,
						tone: existing?.tone ?? 'neutral',
						height: existing?.height ?? 100,
						label: existing?.label ?? item.key,
					};
				} )
			);
		};

		const tileElements = useMemo(
			() =>
				tiles.map( ( tile ) => (
					<Tile
						key={ tile.key }
						tone={ tile.tone }
						height={ tile.height }
					>
						{ tile.label }
					</Tile>
				) ),
			[ tiles ]
		);

		return (
			<DashboardLanes
				{ ...args }
				layout={ layout }
				onChangeLayout={ onChangeLayout }
			>
				{ tileElements }
			</DashboardLanes>
		);
	},
};
