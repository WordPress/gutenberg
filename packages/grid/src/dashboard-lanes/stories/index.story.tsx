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
import type { GridOverlayRenderProps } from '../../shared/types';

const meta: Meta< typeof DashboardLanes > = {
	title: 'Grid/DashboardLanes',
	component: DashboardLanes,
	tags: [ 'status-experimental' ],
	args: {
		columns: 4,
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
	brand: 'var(--wpds-color-background-surface-brand)',
	info: 'var(--wpds-color-background-surface-info)',
	success: 'var(--wpds-color-background-surface-success)',
	warning: 'var(--wpds-color-background-surface-warning)',
	error: 'var(--wpds-color-background-surface-error)',
	neutral: 'var(--wpds-color-background-surface-neutral-weak)',
};

const fgTokens: Record< Tone, string > = {
	// `brand` has no dedicated fg-content token in the design system,
	// so neutral content reads safely against the brand surface tint.
	brand: 'var(--wpds-color-foreground-content-neutral)',
	info: 'var(--wpds-color-foreground-content-info)',
	success: 'var(--wpds-color-foreground-content-success)',
	warning: 'var(--wpds-color-foreground-content-warning)',
	error: 'var(--wpds-color-foreground-content-error)',
	neutral: 'var(--wpds-color-foreground-content-neutral)',
};

function Tile( {
	tone,
	height,
	index,
	children,
	...props
}: {
	tone: Tone;
	height: number;
	index?: number;
	children?: React.ReactNode;
} & React.HTMLAttributes< HTMLDivElement > ) {
	return (
		<div
			{ ...props }
			style={ {
				backgroundColor: bgTokens[ tone ],
				color: fgTokens[ tone ],
				padding: '12px 16px',
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: 'center',
				position: 'relative',
				overflow: 'hidden',
				height,
				boxSizing: 'border-box',
				fontFamily: 'var(--wpds-typography-font-family-body)',
				fontSize: 'var(--wpds-typography-font-size-sm)',
				borderRadius: 6,
				...props?.style,
			} }
		>
			{ index !== undefined && (
				<span
					aria-hidden
					style={ {
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '3rem',
						fontWeight: 700,
						opacity: 0.3,
						pointerEvents: 'none',
						userSelect: 'none',
					} }
				>
					{ index }
				</span>
			) }
			{ children && (
				<span style={ { position: 'relative' } }>{ children }</span>
			) }
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
			<Tile key="a" tone="brand" height={ 120 } index={ 1 }>
				120px
			</Tile>,
			<Tile key="b" tone="info" height={ 200 } index={ 2 }>
				200px
			</Tile>,
			<Tile key="c" tone="success" height={ 80 } index={ 3 }>
				80px
			</Tile>,
			<Tile key="d" tone="warning" height={ 160 } index={ 4 }>
				160px
			</Tile>,
			<Tile key="e" tone="error" height={ 100 } index={ 5 }>
				100px
			</Tile>,
			<Tile key="f" tone="neutral" height={ 240 } index={ 6 }>
				240px
			</Tile>,
			<Tile key="g" tone="brand" height={ 140 } index={ 7 }>
				140px
			</Tile>,
			<Tile key="h" tone="info" height={ 90 } index={ 8 }>
				90px
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
			<Tile key="a" tone="brand" height={ 120 } index={ 1 } />,
			<Tile key="b" tone="info" height={ 200 } index={ 2 } />,
			<Tile key="c" tone="success" height={ 80 } index={ 3 } />,
			<Tile key="d" tone="warning" height={ 160 } index={ 4 } />,
			<Tile key="e" tone="error" height={ 100 } index={ 5 } />,
			<Tile key="f" tone="neutral" height={ 240 } index={ 6 } />,
		],
	},
};

/**
 * Layered configuration: `columns` caps the lane count and
 * `minColumnWidth` enforces a per-tile width floor. The surface
 * renders up to `columns` lanes on wide containers and reduces the
 * count on narrow ones whenever fitting all of them would push
 * tiles below `minColumnWidth`.
 */
export const Layered: Story = {
	args: {
		columns: 4,
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
			<Tile key="a" tone="brand" height={ 120 } index={ 1 } />,
			<Tile key="b" tone="info" height={ 200 } index={ 2 } />,
			<Tile key="c" tone="success" height={ 80 } index={ 3 } />,
			<Tile key="d" tone="warning" height={ 160 } index={ 4 } />,
			<Tile key="e" tone="error" height={ 100 } index={ 5 } />,
			<Tile key="f" tone="neutral" height={ 240 } index={ 6 } />,
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
			<Tile key="a" tone="brand" height={ 120 } index={ 1 } />,
			<Tile key="wide" tone="info" height={ 100 } index={ 2 }>
				span 2
			</Tile>,
			<Tile key="b" tone="success" height={ 80 } index={ 3 } />,
			<Tile key="c" tone="warning" height={ 200 } index={ 4 } />,
			<Tile key="d" tone="error" height={ 90 } index={ 5 } />,
			<Tile key="taller-wide" tone="neutral" height={ 160 } index={ 6 }>
				span 2
			</Tile>,
			<Tile key="e" tone="brand" height={ 110 } index={ 7 } />,
		],
	},
};

/**
 * Edit mode: drag to reorder, resize from the bottom-right corner
 * (horizontal only — heights are content-driven). Drop commits the
 * new layout via `onChangeLayout`.
 *
 * While `editMode` is on, `<DashboardLanes />` paints its default
 * overlay behind the tiles to mark the lane tracks. Lanes paint
 * columns only — there are no row markers because heights are
 * content-driven.
 *
 * Theme the default look in place via `--wp-grid-overlay-tile-bg`,
 * or replace the visual wholesale
 * by passing `renderGridOverlay`. See the `Custom Grid Overlay`
 * story below for a full override example.
 */
export const EditMode: Story = {
	args: {
		columns: 4,
		editMode: true,
	},
	render: function EditModeStory( args ) {
		const initial: ( DashboardLanesLayoutItem & {
			tone: Tone;
			height: number;
			label: string;
		} )[] = [
			{ key: 'a', tone: 'brand', height: 120, label: '120px' },
			{ key: 'b', tone: 'info', height: 200, label: '200px' },
			{
				key: 'wide',
				width: 2,
				tone: 'success',
				height: 100,
				label: 'span 2',
			},
			{ key: 'c', tone: 'warning', height: 160, label: '160px' },
			{ key: 'd', tone: 'error', height: 90, label: '90px' },
			{ key: 'e', tone: 'neutral', height: 240, label: '240px' },
			{ key: 'f', tone: 'brand', height: 140, label: '140px' },
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
				tiles.map( ( tile, i ) => (
					<Tile
						key={ tile.key }
						tone={ tile.tone }
						height={ tile.height }
						index={ i + 1 }
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

/**
 * Example custom overlay supplied to `<DashboardLanes />` through the
 * `renderGridOverlay` prop. Receives `{ columns, isActive }` from the
 * surface (no `rowHeight` because lane heights are content-driven).
 * The custom must honor `isActive` for the same cross-fade behavior
 * as the default; the surface always mounts the overlay.
 *
 * @param props          Render props supplied by the surface.
 * @param props.columns  Number of lane tracks to mirror.
 * @param props.isActive Whether the overlay should be visible.
 */
function NumberedLanesOverlay( { columns, isActive }: GridOverlayRenderProps ) {
	return (
		<div
			aria-hidden
			style={ {
				position: 'absolute',
				inset: 0,
				display: 'grid',
				gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
				gap: 'var(--wpds-dimension-gap-xl)',
				pointerEvents: 'none',
				opacity: isActive ? 1 : 0,
				visibility: isActive ? 'visible' : 'hidden',
				transition: isActive
					? 'opacity 200ms ease, visibility 0s linear 0s'
					: 'opacity 200ms ease, visibility 0s linear 200ms',
				backgroundImage: `repeating-linear-gradient(135deg, color-mix(in srgb, var(--wpds-color-background-surface-info) 24%, transparent) 0 6px, transparent 6px 12px)`,
			} }
		>
			{ Array.from( { length: columns } ).map( ( _, i ) => (
				<div
					key={ i }
					style={ {
						outline:
							'1px dashed var(--wpds-color-stroke-surface-info)',
						backgroundColor:
							'color-mix(in srgb, var(--wpds-color-background-surface-info) 10%, transparent)',
						position: 'relative',
					} }
				>
					<span
						style={ {
							position: 'absolute',
							top: 4,
							insetInlineStart: 4,
							fontSize: 10,
							padding: '1px 6px',
							borderRadius: 2,
							background:
								'var(--wpds-color-background-surface-info)',
							color: 'var(--wpds-color-foreground-content-info)',
							fontFamily:
								'var(--wpds-typography-font-family-mono)',
						} }
					>
						{ i + 1 }
					</span>
				</div>
			) ) }
		</div>
	);
}

/**
 * Replaces the surface's default edit-mode overlay with a custom
 * visual through the `renderGridOverlay` prop. The same contract as
 * `<DashboardGrid />`'s override path, with `rowHeight` omitted from
 * the render props because lanes are content-driven vertically.
 *
 * Pass `renderGridOverlay={ () => null }` to suppress the overlay
 * entirely while keeping `editMode` interactions on.
 */
export const CustomGridOverlayStory: Story = {
	name: 'Custom Grid Overlay',
	args: {
		columns: 4,
		editMode: true,
	},
	render: function CustomGridOverlayRender( args ) {
		const initial: ( DashboardLanesLayoutItem & {
			tone: Tone;
			height: number;
			label: string;
		} )[] = [
			{ key: 'a', tone: 'brand', height: 140, label: '140px' },
			{ key: 'b', tone: 'info', height: 200, label: '200px' },
			{
				key: 'wide',
				width: 2,
				tone: 'success',
				height: 120,
				label: 'span 2',
			},
			{ key: 'c', tone: 'warning', height: 180, label: '180px' },
			{ key: 'd', tone: 'error', height: 100, label: '100px' },
			{ key: 'e', tone: 'neutral', height: 220, label: '220px' },
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
				tiles.map( ( tile, i ) => (
					<Tile
						key={ tile.key }
						tone={ tile.tone }
						height={ tile.height }
						index={ i + 1 }
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
				renderGridOverlay={ NumberedLanesOverlay }
			>
				{ tileElements }
			</DashboardLanes>
		);
	},
};
