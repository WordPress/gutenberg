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
import { DashboardGrid } from '../grid';
import type {
	DashboardGridLayoutItem,
	ResizeHandleRenderProps,
} from '../types';

const meta: Meta< typeof DashboardGrid > = {
	title: 'Grid/DashboardGrid',
	component: DashboardGrid,
	args: {
		columns: 6,
		spacing: 2,
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
		spacing: {
			control: { type: 'number', min: 0, max: 16, step: 1 },
			description: 'Gap multiplier (effective gap = spacing × 4px).',
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
};
export default meta;

type Story = StoryObj< typeof DashboardGrid >;

type Tone = 'brand' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

// Static token maps so the build-time token fallback plugin can inject
// fallbacks into each `var()` call. Using literal strings keeps the
// `@wordpress/no-unknown-ds-tokens` lint rule happy.
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
				label="Fill width"
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
	warning: 'var(--wpds-color-bg-surface-warning)',
	success: 'var(--wpds-color-bg-surface-success)',
};

const panelFgTokens: Record< 'warning' | 'success', string > = {
	warning: 'var(--wpds-color-fg-content-warning)',
	success: 'var(--wpds-color-fg-content-success)',
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
 * Visualizes the grid's column tracks and gaps as a Chrome
 * DevTools-style overlay. Renders a sibling grid behind
 * `DashboardGrid` with the same template, so the column tracks
 * line up exactly with the live layout.
 */
function GridVisualizer( {
	columns,
	spacing,
}: {
	columns: number;
	spacing: number;
} ) {
	const gapPx = spacing * 4;
	return (
		<div
			aria-hidden
			style={ {
				position: 'absolute',
				top: 24,
				right: 0,
				bottom: 0,
				left: 0,
				background: `repeating-linear-gradient(135deg, color-mix(in srgb, var(--wpds-color-bg-surface-warning) 28%, transparent) 0 6px, transparent 6px 12px)`,
				display: 'grid',
				gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
				gap: gapPx,
				pointerEvents: 'none',
				zIndex: 0,
			} }
		>
			{ Array.from( { length: columns } ).map( ( _, i ) => (
				<div
					key={ i }
					style={ {
						outline:
							'1px dashed var(--wpds-color-stroke-surface-warning)',
						position: 'relative',
					} }
				>
					<span
						style={ {
							position: 'absolute',
							top: -18,
							left: 0,
							fontSize: 10,
							padding: '1px 4px',
							borderRadius: 2,
							background: 'var(--wpds-color-bg-surface-warning)',
							color: 'var(--wpds-color-fg-content-warning)',
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
 * Edit mode with drag, resize, and all width modes. A state panel
 * shows the raw layout JSON. Drag items to reorder; resize from the
 * bottom-right handle. Keyboard sensor is enabled: use Tab to focus
 * an item, Space to grab, arrow keys to move, Space to drop.
 */
export const EditMode: Story = {
	args: {
		columns: 12,
		spacing: 4,
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
				<div
					style={ {
						width: '800px',
						position: 'relative',
						paddingTop: 24,
					} }
				>
					<GridVisualizer
						columns={ args.columns ?? 12 }
						spacing={ args.spacing ?? 4 }
					/>
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

export const CustomResizeHandleStory: Story = {
	name: 'Custom Resize Handle',
	args: {
		columns: 6,
		spacing: 2,
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
	render: function CustomResizeHandleRender( args ) {
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
				renderResizeHandle={ ( props ) => (
					<CustomResizeHandle { ...props } />
				) }
			>
				{ tiles }
			</DashboardGrid>
		);
	},
};
