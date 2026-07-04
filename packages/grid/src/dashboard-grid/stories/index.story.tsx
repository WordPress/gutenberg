/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { close, justifyStretch, stretchFullWidth } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- @wordpress/grid consumes @wordpress/ui in story examples only.
import { Icon, IconButton, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { DashboardGrid } from '..';
import type { DashboardGridLayoutItem } from '../types';
import type {
	DragPreviewRenderProps,
	GridOverlayRenderProps,
	ResizeHandleRenderProps,
} from '../../shared/types';

const meta: Meta< typeof DashboardGrid > = {
	title: 'Grid/DashboardGrid',
	component: DashboardGrid,
	tags: [ 'status-experimental' ],
	args: {
		columns: 6,
		rowHeight: 80,
		editMode: false,
	},
	argTypes: {
		children: { control: false },
		columns: {
			control: { type: 'number', min: 1, max: 24, step: 1 },
			description: 'Total columns in fixed mode.',
		},
		minColumnWidth: {
			control: { type: 'number', min: 80, max: 600, step: 8 },
			description:
				'Enables responsive mode. Per-column lower bound in pixels.',
		},
		rowHeight: {
			control: { type: 'number', min: 24, max: 400, step: 4 },
			description: 'Row height in pixels, or `auto`.',
		},
		editMode: {
			control: { type: 'boolean' },
			description: 'Enables drag-to-reorder and resize.',
		},
		className: { control: { type: 'text' } },
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

type Story = StoryObj< typeof DashboardGrid >;

type Tone = 'brand' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

// Static token maps so the build-time token fallback plugin can inject
// fallbacks into each `var()` call. Using literal strings keeps the
// `@wordpress/no-unknown-ds-tokens` lint rule happy.
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
	children,
	actionableArea,
	...props
}: {
	tone: Tone;
	children: React.ReactNode;
	actionableArea?: React.ReactNode;
} & React.HTMLAttributes< HTMLDivElement > ) {
	return (
		<div
			{ ...props }
			style={ {
				backgroundColor: bgTokens[ tone ],
				color: fgTokens[ tone ],
				padding: '20px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				boxSizing: 'border-box',
				fontFamily: 'var(--wpds-typography-font-family-body)',
				fontSize: 'var(--wpds-typography-font-size-sm)',
				...props?.style,
			} }
		>
			{ children }
		</div>
	);
}

function TileActions( {
	isFill,
	isFull,
	onToggleFill,
	onToggleFull,
	onRemove,
}: {
	isFill: boolean;
	isFull: boolean;
	onToggleFill: () => void;
	onToggleFull: () => void;
	onRemove: () => void;
} ) {
	return (
		<div
			style={ {
				position: 'absolute',
				display: 'flex',
				gap: 4,
				top: 4,
				right: 4,
				zIndex: 2,
			} }
		>
			<IconButton
				size="small"
				variant="solid"
				tone={ isFill ? 'brand' : 'neutral' }
				icon={ justifyStretch }
				label="Fill available width"
				aria-pressed={ isFill }
				onClick={ onToggleFill }
			/>

			<IconButton
				size="small"
				variant="solid"
				tone={ isFull ? 'brand' : 'neutral' }
				icon={ stretchFullWidth }
				label="Full width"
				aria-pressed={ isFull }
				onClick={ onToggleFull }
			/>

			<IconButton
				size="small"
				variant="solid"
				tone="neutral"
				icon={ close }
				label="Remove"
				onClick={ onRemove }
			/>
		</div>
	);
}

function formatTileLabel( item: DashboardGridLayoutItem ): string {
	let width: string;
	if ( item.width === 'fill' ) {
		width = 'width: "fill"';
	} else if ( item.width === 'full' ) {
		width = 'width: "full"';
	} else {
		width = `width: ${ item.width ?? 1 }`;
	}
	const height = ( item.height ?? 1 ) > 1 ? `, height: ${ item.height }` : '';
	return width + height;
}

// Static token maps so the build-time token fallback plugin can inject
// fallbacks into each `var()` call.
const panelBgTokens: Record< 'warning' | 'success', string > = {
	warning: 'var(--wpds-color-background-surface-warning)',
	success: 'var(--wpds-color-background-surface-success)',
};

const panelFgTokens: Record< 'warning' | 'success', string > = {
	warning: 'var(--wpds-color-foreground-content-warning)',
	success: 'var(--wpds-color-foreground-content-success)',
};

const panelStrokeTokens: Record< 'warning' | 'success', string > = {
	warning: 'var(--wpds-color-stroke-surface-warning)',
	success: 'var(--wpds-color-stroke-surface-success)',
};

function LayoutStatePanel( {
	label,
	layout,
	tone,
}: {
	label: string;
	layout: DashboardGridLayoutItem[];
	tone: 'warning' | 'success';
} ) {
	return (
		<Stack
			direction="column"
			gap="sm"
			style={ {
				width: 280,
				padding: 16,
				background: panelBgTokens[ tone ],
				border: `1px solid ${ panelStrokeTokens[ tone ] }`,
				borderRadius: 8,
				fontFamily: 'var(--wpds-typography-font-family-mono)',
				fontSize: 12,
				color: panelFgTokens[ tone ],
			} }
		>
			<strong
				style={ {
					fontFamily: 'var(--wpds-typography-font-family-body)',
					fontSize: 11,
					textTransform: 'uppercase',
					letterSpacing: '0.04em',
				} }
			>
				{ label }
			</strong>
			<pre
				style={ {
					margin: 0,
					overflow: 'auto',
					lineHeight: 1.5,
				} }
			>
				{ JSON.stringify( layout, null, 2 ) }
			</pre>
		</Stack>
	);
}

/**
 * Static grid with a fixed number of columns. Each item declares its
 * column span via `width`. Items flow left-to-right and wrap to new
 * rows as the total exceeds `columns`.
 */
export const Default: Story = {
	args: {
		layout: [
			{ key: 'a', width: 1 },
			{ key: 'b', width: 3 },
			{ key: 'c', width: 2 },
			{ key: 'd', width: 4 },
			{ key: 'e', width: 2 },
		],
		columns: 6,
		children: [
			<Tile key="a" tone="brand">
				width: 1
			</Tile>,
			<Tile key="b" tone="info">
				width: 3
			</Tile>,
			<Tile key="c" tone="success">
				width: 2
			</Tile>,
			<Tile key="d" tone="warning">
				width: 4
			</Tile>,
			<Tile key="e" tone="error">
				width: 2
			</Tile>,
		],
	},
};

/**
 * Responsive grid: the column count is derived from the container
 * width using `minColumnWidth` as the lower bound per column. A
 * `ResizeObserver` recomputes the count on container resize.
 */
export const Responsive: Story = {
	args: {
		layout: [
			{ key: 'a', width: 1, order: 1 },
			{ key: 'b', width: 2, order: 2 },
			{ key: 'c', width: 2, order: 3 },
			{ key: 'd', width: 1, order: 4 },
			{ key: 'e', width: 2, order: 5 },
			{ key: 'f', width: 2, order: 6 },
		],
		rowHeight: 96,
		minColumnWidth: 192,
		children: [
			<Tile key="a" tone="brand">
				width: 1
			</Tile>,
			<Tile key="b" tone="info">
				width: 2
			</Tile>,
			<Tile key="c" tone="success">
				width: 2
			</Tile>,
			<Tile key="d" tone="warning">
				width: 1
			</Tile>,
			<Tile key="e" tone="error">
				width: 2
			</Tile>,
			<Tile key="f" tone="neutral">
				width: 2
			</Tile>,
		],
	},
};

/**
 * Layered configuration: `columns` caps the count and
 * `minColumnWidth` enforces a per-tile width floor. The grid renders
 * up to `columns` columns on wide containers and reduces the count
 * on narrow ones whenever fitting all of them would push tiles
 * below `minColumnWidth`. Resize the preview to see the cap apply
 * on wide widths and the floor reduce the count on narrow widths.
 */
export const Layered: Story = {
	args: {
		layout: [
			{ key: 'a', width: 1, order: 1 },
			{ key: 'b', width: 2, order: 2 },
			{ key: 'c', width: 2, order: 3 },
			{ key: 'd', width: 1, order: 4 },
			{ key: 'e', width: 2, order: 5 },
			{ key: 'f', width: 2, order: 6 },
		],
		rowHeight: 96,
		columns: 6,
		minColumnWidth: 240,
		children: [
			<Tile key="a" tone="brand">
				width: 1
			</Tile>,
			<Tile key="b" tone="info">
				width: 2
			</Tile>,
			<Tile key="c" tone="success">
				width: 2
			</Tile>,
			<Tile key="d" tone="warning">
				width: 1
			</Tile>,
			<Tile key="e" tone="error">
				width: 2
			</Tile>,
			<Tile key="f" tone="neutral">
				width: 2
			</Tile>,
		],
	},
};

/**
 * A `width: 'fill'` item expands to cover the remaining columns in
 * its row. Mix it with fixed-width items on either side to build
 * sidebar-like layouts that adapt to the column count.
 */
export const FillWidth: Story = {
	args: {
		layout: [
			{ key: 'left', width: 1 },
			{ key: 'fill', width: 'fill' },
			{ key: 'right', width: 2 },
			{ key: 'solo', width: 'fill' },
		],
		columns: 6,
		children: [
			<Tile key="left" tone="brand">
				width: 1
			</Tile>,
			<Tile key="fill" tone="info">
				width: &quot;fill&quot;
			</Tile>,
			<Tile key="right" tone="success">
				width: 2
			</Tile>,
			<Tile key="solo" tone="warning">
				width: &quot;fill&quot; (alone in row)
			</Tile>,
		],
	},
};

/**
 * A `width: 'full'` item spans every column (`grid-column: 1 / -1`),
 * forcing a row break around it. Useful for dividers, hero banners,
 * or embedded content that should always take the full width.
 */
export const FullWidth: Story = {
	args: {
		layout: [
			{ key: 'a', width: 2 },
			{ key: 'b', width: 4 },
			{ key: 'hero', width: 'full', height: 1 },
			{ key: 'c', width: 3 },
			{ key: 'd', width: 3 },
		],
		columns: 6,
		children: [
			<Tile key="a" tone="brand">
				width: 2
			</Tile>,
			<Tile key="b" tone="info">
				width: 4
			</Tile>,
			<Tile key="hero" tone="success">
				width: &quot;full&quot;
			</Tile>,
			<Tile key="c" tone="warning">
				width: 3
			</Tile>,
			<Tile key="d" tone="error">
				width: 3
			</Tile>,
		],
	},
};

/**
 * Numeric `rowHeight` lets items span multiple rows via `height`.
 * Combined with `width`, this produces tile-based dashboards where
 * each cell can be tuned independently.
 */
export const RowHeight: Story = {
	args: {
		layout: [
			{ key: 'a', width: 2, height: 2, order: 1 },
			{ key: 'b', width: 2, height: 1, order: 2 },
			{ key: 'c', width: 2, height: 3, order: 3 },
			{ key: 'd', width: 4, height: 1, order: 4 },
			{ key: 'e', width: 2, height: 1, order: 5 },
		],
		columns: 6,
		rowHeight: 80,
		children: [
			<Tile key="a" tone="brand">
				2 cols × 2 rows
			</Tile>,
			<Tile key="b" tone="info">
				2 cols × 1 row
			</Tile>,
			<Tile key="c" tone="success">
				2 cols × 3 rows
			</Tile>,
			<Tile key="d" tone="warning">
				4 cols × 1 row
			</Tile>,
			<Tile key="e" tone="error">
				2 cols × 1 row
			</Tile>,
		],
	},
};

/**
 * Edit mode with drag, resize, and all width modes. While `editMode`
 * is on, `<DashboardGrid />` paints its default overlay behind the
 * tiles to visualize the underlying template: rounded row-marker
 * tiles in each column when `rowHeight` is numeric. The overlay
 * disappears when `editMode` flips back to `false`.
 *
 * Theme the default look in place via `--wp-grid-overlay-tile-bg`,
 * or replace the visual wholesale by passing `renderGridOverlay`.
 * See the `Custom Grid Overlay` story for a full override example.
 *
 * A state panel shows the raw layout JSON. Drag items to reorder;
 * resize from the bottom-right handle. Keyboard sensor is enabled:
 * use Tab to focus an item, Space to grab, arrow keys to move, Space
 * to drop.
 */
export const EditMode: Story = {
	args: {
		columns: 12,
		rowHeight: 80,
		editMode: true,
	},

	render: function EditModeStory( args ) {
		const initialLayout: ( DashboardGridLayoutItem & {
			tone: Tone;
		} )[] = [
			{
				key: 'fixed-1',
				width: 1,
				height: 1,
				order: 1,
				tone: 'success',
			},
			{
				key: 'fixed-1-1',
				width: 5,
				height: 1,
				order: 2,
				tone: 'info',
			},
			{
				key: 'fixed-2',
				width: 5,
				height: 1,
				order: 3,
				tone: 'brand',
			},
			{
				key: 'full',
				width: 'full',
				height: 1,
				order: 4,
				tone: 'neutral',
			},
			{
				key: 'fixed-3',
				width: 2,
				height: 1,
				order: 5,
				tone: 'warning',
			},
			{
				key: 'fixed-4',
				width: 2,
				height: 1,
				order: 6,
				tone: 'error',
			},
		];

		const [ tiles, setTiles ] = useState( initialLayout );
		const [ previewLayout, setPreviewLayout ] = useState<
			DashboardGridLayoutItem[] | null
		>( null );

		const layout: DashboardGridLayoutItem[] = tiles.map(
			( { tone: _tone, ...item } ) => item
		);

		const onChangeLayout = ( next: DashboardGridLayoutItem[] ) => {
			setTiles(
				next.map( ( item ) => {
					const existing = tiles.find( ( t ) => t.key === item.key );
					return {
						...item,
						tone: existing?.tone ?? 'neutral',
					};
				} )
			);
			setPreviewLayout( null );
		};

		const removeTile = ( key: string ) => {
			setTiles( tiles.filter( ( tile ) => tile.key !== key ) );
		};

		const toggleFill = ( key: string ) => {
			setTiles(
				tiles.map( ( tile ) =>
					tile.key === key
						? {
								...tile,
								width:
									tile.width === 'fill' ? undefined : 'fill',
						  }
						: tile
				)
			);
		};

		const toggleFull = ( key: string ) => {
			setTiles(
				tiles.map( ( tile ) =>
					tile.key === key
						? {
								...tile,
								width:
									tile.width === 'full' ? undefined : 'full',
						  }
						: tile
				)
			);
		};

		// Memoize the Tile elements so the grid's `children` prop keeps
		// a stable reference across parent re-renders driven by
		// onPreviewLayout. Without this, every preview tick produces a
		// fresh array of elements and the grid's children walk has to
		// re-run on each frame of a resize gesture.
		const tileElements = useMemo(
			() =>
				tiles.map( ( tile ) => (
					<Tile
						key={ tile.key }
						tone={ tile.tone }
						actionableArea={
							<TileActions
								isFill={ tile.width === 'fill' }
								isFull={ tile.width === 'full' }
								onToggleFill={ () => toggleFill( tile.key ) }
								onToggleFull={ () => toggleFull( tile.key ) }
								onRemove={ () => removeTile( tile.key ) }
							/>
						}
					>
						{ formatTileLabel( tile ) }
					</Tile>
				) ),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[ tiles ]
		);

		return (
			<Stack direction="row" gap="lg" align="flex-start">
				<div style={ { width: '800px' } }>
					<DashboardGrid
						{ ...args }
						layout={ layout }
						onChangeLayout={ onChangeLayout }
						onPreviewLayout={ setPreviewLayout }
					>
						{ tileElements }
					</DashboardGrid>
				</div>

				<LayoutStatePanel
					label={ previewLayout ? 'Staging' : 'Committed' }
					layout={ previewLayout ?? layout }
					tone={ previewLayout ? 'warning' : 'success' }
				/>
			</Stack>
		);
	},
};

/**
 * Custom corner-resize glyph: a diagonal line plus a filled triangle,
 * both leaning toward the bottom-right corner of the tile.
 */
const resizeCornerSE = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<path
			d="M0 24L24 0"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			fill="none"
		/>

		<polygon points="24,24 10,24 24,10" fill="currentColor" />
	</svg>
);

/**
 * Override the default corner-triangle resize handle with a custom
 * element via `renderResizeHandle`. The grid keeps the gesture
 * machinery (dnd-kit context, throttled delta loop) and passes the
 * wiring (`ref`, `listeners`, `attributes`) to the consumer — so the
 * custom visual still drives the same resize behavior.
 */
function CustomResizeHandle( {
	ref,
	listeners,
	attributes,
	isResizing,
}: ResizeHandleRenderProps ) {
	return (
		<div
			ref={ ref }
			{ ...listeners }
			{ ...attributes }
			style={ {
				position: 'absolute',
				bottom: 0,
				insetInlineEnd: 0,
				display: 'flex',
				cursor: 'nwse-resize',
				opacity: isResizing ? 0.5 : 1,
				transition: 'opacity 120ms ease',
			} }
		>
			<Icon icon={ resizeCornerSE } size={ 16 } />
		</div>
	);
}

/**
 * Example `renderDragPreview` wrapper: keeps the clone height chain
 * intact. Lift, shadow, and motion live on the grid
 * `.drag-preview-frame`; set `--wp-grid-drag-preview-radius` on the
 * surface when the lift shadow should match rounded tiles (see widget
 * dashboard).
 */
function CustomDragPreview( { children }: DragPreviewRenderProps ) {
	return <div style={ { height: '100%' } }>{ children }</div>;
}

/**
 * Exercises the three customization vectors on a single grid:
 *
 * 1. `renderResizeHandle` swaps the default corner triangle for a
 *    custom diagonal-arrow icon.
 * 2. `renderDragPreview` wraps the dragged clone (here only for the
 *    height chain; lift and shadow stay on the grid frame).
 * 3. CSS custom properties on an ancestor retheme the lift scale,
 *    placeholder opacity, placeholder outline color, and placeholder
 *    border-radius without touching the package.
 *
 * Toggle `editMode`, then drag and resize a tile to see all three
 * respond.
 */
export const Customization: Story = {
	args: {
		columns: 6,
		rowHeight: 80,
		editMode: true,
		layout: [
			{ key: 'a', width: 2, height: 1 },
			{ key: 'b', width: 4, height: 1 },
			{ key: 'c', width: 3, height: 2 },
			{ key: 'd', width: 3, height: 1 },
			{ key: 'e', width: 3, height: 1 },
		],
	},
	render: function CustomizationRender( args ) {
		const [ layout, setLayout ] = useState< DashboardGridLayoutItem[] >(
			args.layout
		);

		const tiles = useMemo(
			() => [
				<Tile key="a" tone="brand">
					A
				</Tile>,
				<Tile key="b" tone="info">
					B
				</Tile>,
				<Tile key="c" tone="success">
					C
				</Tile>,
				<Tile key="d" tone="warning">
					D
				</Tile>,
				<Tile key="e" tone="error">
					E
				</Tile>,
			],
			[]
		);

		const customTokens = {
			'--wp-grid-drag-preview-scale': '1.08',
			'--wp-grid-placeholder-opacity': '0.2',
			'--wp-grid-placeholder-outline-color':
				'var(--wpds-color-foreground-content-warning)',
			'--wp-grid-placeholder-radius': '12px',
		} as React.CSSProperties;

		return (
			<div style={ customTokens }>
				<DashboardGrid
					{ ...args }
					layout={ layout }
					onChangeLayout={ setLayout }
					renderResizeHandle={ CustomResizeHandle }
					renderDragPreview={ CustomDragPreview }
				>
					{ tiles }
				</DashboardGrid>
			</div>
		);
	},
};

/**
 * Example custom overlay supplied to `<DashboardGrid />` through the
 * `renderGridOverlay` prop. Receives the grid's resolved column
 * count, gap, row height, and `isActive` flag; this implementation
 * drops the row dividers, swaps to an info tone, labels each column
 * track with its index, and fades in/out on `isActive` toggles. The
 * grid always mounts the overlay; the consumer owns the visual and
 * its transition.
 *
 * @param props          Render props supplied by the grid.
 * @param props.columns  Number of column tracks to mirror.
 * @param props.isActive Whether the overlay should be visible.
 */
function NumberedOverlay( { columns, isActive }: GridOverlayRenderProps ) {
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
 * Replaces the package's default edit-mode overlay with a custom
 * visual through the `renderGridOverlay` prop. The grid mounts the
 * supplied component as a sibling behind the tiles whenever
 * `editMode` is on, passing the resolved `{ columns, rowHeight }`
 * so the override can reproduce the column and row tracks
 * pixel-accurately without re-deriving them.
 *
 * Here the override (see `NumberedOverlay` above) swaps the warning
 * tone for info, drops the row dividers, and labels each column
 * track with its index. Pass `renderGridOverlay={ () => null }` to
 * suppress the overlay entirely while keeping `editMode` interactions
 * on.
 */
export const CustomGridOverlayStory: Story = {
	name: 'Custom Grid Overlay',
	args: {
		columns: 12,
		rowHeight: 80,
		editMode: true,
		layout: [
			{ key: 'a', width: 3, height: 1 },
			{ key: 'b', width: 5, height: 1 },
			{ key: 'c', width: 4, height: 1 },
			{ key: 'd', width: 2, height: 2 },
			{ key: 'e', width: 6, height: 1 },
		],
	},
	render: function CustomGridOverlayRender( args ) {
		const [ layout, setLayout ] = useState< DashboardGridLayoutItem[] >(
			args.layout
		);

		const tiles = useMemo(
			() => [
				<Tile key="a" tone="brand">
					A
				</Tile>,
				<Tile key="b" tone="info">
					B
				</Tile>,
				<Tile key="c" tone="success">
					C
				</Tile>,
				<Tile key="d" tone="warning">
					D
				</Tile>,
				<Tile key="e" tone="error">
					E
				</Tile>,
			],
			[]
		);

		return (
			<DashboardGrid
				{ ...args }
				layout={ layout }
				onChangeLayout={ setLayout }
				renderGridOverlay={ NumberedOverlay }
			>
				{ tiles }
			</DashboardGrid>
		);
	},
};
