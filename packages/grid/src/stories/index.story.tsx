/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { close, justifyStretch, stretchFullWidth } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- @wordpress/grid consumes @wordpress/ui in story examples only.
import { IconButton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { DashboardGrid } from '../grid';
import type { DashboardGridLayoutItem } from '../types';

const meta: Meta< typeof DashboardGrid > = {
	title: 'Design System/Components/DashboardGrid',
	component: DashboardGrid,
	argTypes: {
		children: { control: false },
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
				tone="neutral"
				icon={ justifyStretch }
				label="Fill width"
				aria-pressed={ isFill }
				onClick={ onToggleFill }
			/>

			<IconButton
				size="small"
				variant="solid"
				tone="neutral"
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

function LayoutStatePanel( { layout }: { layout: DashboardGridLayoutItem[] } ) {
	return (
		<div
			style={ {
				marginBottom: 16,
				padding: 12,
				background: 'var(--wpds-color-bg-surface-neutral-weak)',
				borderRadius: 4,
				fontFamily: 'var(--wpds-typography-font-family-mono)',
				fontSize: 12,
			} }
		>
			<strong>Layout state:</strong>
			<pre
				style={ {
					margin: '8px 0 0',
					whiteSpace: 'pre-wrap',
				} }
			>
				{ JSON.stringify( layout, null, 2 ) }
			</pre>
		</div>
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
 * A `fillWidth` item expands to cover the remaining columns in its
 * row. Mix `fillWidth` with fixed-width items on either side to
 * build sidebar-like layouts that adapt to the column count.
 */
export const FillWidth: Story = {
	args: {
		layout: [
			{ key: 'left', width: 1 },
			{ key: 'fill', fillWidth: true },
			{ key: 'right', width: 2 },
			{ key: 'solo', fillWidth: true },
		],
		columns: 6,
		children: [
			<Tile key="left" tone="brand">
				width: 1
			</Tile>,
			<Tile key="fill" tone="info">
				fillWidth
			</Tile>,
			<Tile key="right" tone="success">
				width: 2
			</Tile>,
			<Tile key="solo" tone="warning">
				fillWidth (alone in row)
			</Tile>,
		],
	},
};

/**
 * A `fullWidth` item spans every column (`grid-column: 1 / -1`),
 * forcing a row break around it. Useful for dividers, hero banners,
 * or embedded content that should always take the full width.
 */
export const FullWidth: Story = {
	args: {
		layout: [
			{ key: 'a', width: 2 },
			{ key: 'b', width: 4 },
			{ key: 'hero', fullWidth: true, height: 1 },
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
				fullWidth
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
 * Edit mode with drag, resize, and all width modes. A state panel
 * shows the raw layout JSON. Drag items to reorder; resize from the
 * bottom-right handle. Keyboard sensor is enabled: use Tab to focus
 * an item, Space to grab, arrow keys to move, Space to drop.
 */
export const EditMode: Story = {
	render: function EditModeStory() {
		const initialLayout: ( DashboardGridLayoutItem & {
			tone: Tone;
			label: string;
		} )[] = [
			{
				key: 'fill',
				fillWidth: true,
				height: 1,
				order: 1,
				tone: 'info',
				label: 'fillWidth — resize me',
			},
			{
				key: 'fixed-1',
				width: 1,
				height: 1,
				order: 2,
				tone: 'success',
				label: 'width: 1',
			},
			{
				key: 'fixed-2',
				width: 5,
				height: 1,
				order: 3,
				tone: 'brand',
				label: 'width: 5',
			},
			{
				key: 'full',
				fullWidth: true,
				height: 1,
				order: 4,
				tone: 'neutral',
				label: 'fullWidth — resize me',
			},
			{
				key: 'fixed-3',
				width: 2,
				height: 1,
				order: 5,
				tone: 'warning',
				label: 'width: 2',
			},
			{
				key: 'fixed-4',
				width: 2,
				height: 1,
				order: 6,
				tone: 'error',
				label: 'width: 2',
			},
		];

		const [ tiles, setTiles ] = useState( initialLayout );

		const layout: DashboardGridLayoutItem[] = tiles.map(
			( { tone: _tone, label: _label, ...item } ) => item
		);

		const onChangeLayout = ( next: DashboardGridLayoutItem[] ) => {
			setTiles(
				next.map( ( item ) => {
					const existing = tiles.find( ( t ) => t.key === item.key );
					return {
						...item,
						tone: existing?.tone ?? 'neutral',
						label: existing?.label ?? '',
					};
				} )
			);
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
								fillWidth: tile.fillWidth ? undefined : true,
								fullWidth: undefined,
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
								fullWidth: tile.fullWidth ? undefined : true,
								fillWidth: undefined,
						  }
						: tile
				)
			);
		};

		return (
			<div style={ { width: '800px' } }>
				<DashboardGrid
					layout={ layout }
					columns={ 6 }
					rowHeight={ 80 }
					spacing={ 2 }
					editMode
					onChangeLayout={ onChangeLayout }
				>
					{ tiles.map( ( tile ) => (
						<Tile
							key={ tile.key }
							tone={ tile.tone }
							actionableArea={
								<TileActions
									isFill={ !! tile.fillWidth }
									isFull={ !! tile.fullWidth }
									onToggleFill={ () =>
										toggleFill( tile.key )
									}
									onToggleFull={ () =>
										toggleFull( tile.key )
									}
									onRemove={ () => removeTile( tile.key ) }
								/>
							}
						>
							{ tile.label }
						</Tile>
					) ) }
				</DashboardGrid>

				<LayoutStatePanel layout={ layout } />
			</div>
		);
	},
};

/**
 * Edit mode in uncontrolled usage: no `onChangeLayout` provided, so
 * the grid keeps the pending layout locally across interactions.
 * Useful for verifying that a resize followed by a drag preserves the
 * resize (the two gestures share the same temporary layout).
 */
export const EditModeUncontrolled: Story = {
	args: {
		layout: [
			{ key: 'a', width: 2, height: 1, order: 0 },
			{ key: 'b', width: 2, height: 1, order: 1 },
			{ key: 'c', width: 2, height: 1, order: 2 },
		],
		columns: 6,
		rowHeight: 80,
		editMode: true,
		children: [
			<Tile key="a" tone="brand">
				Resize me, then reorder
			</Tile>,
			<Tile key="b" tone="info">
				Tile B
			</Tile>,
			<Tile key="c" tone="success">
				Tile C
			</Tile>,
		],
	},
};

/**
 * Edit mode with `rowHeight: 'auto'`. Row height is driven by tile
 * content rather than the user, so vertical resize is suppressed: the
 * resize handle uses an `ew-resize` cursor and the preview overlay
 * only grows horizontally.
 */
export const EditModeAutoRows: Story = {
	args: {
		layout: [
			{ key: 'a', width: 2, order: 0 },
			{ key: 'b', width: 2, order: 1 },
			{ key: 'c', width: 2, order: 2 },
		],
		columns: 6,
		rowHeight: 'auto',
		editMode: true,
		children: [
			<Tile key="a" tone="brand">
				Short tile
			</Tile>,
			<Tile
				key="b"
				tone="info"
				style={ { flexDirection: 'column', gap: 4 } }
			>
				<div>Taller tile</div>
				<div>with multiple</div>
				<div>lines of content</div>
			</Tile>,
			<Tile key="c" tone="success">
				Short tile
			</Tile>,
		],
	},
};

/**
 * Demonstrates that `actionableArea` is a grid-level slot rather than
 * a prop on the rendered element: consumers may pass a plain `<div>`
 * as a child and attach `actionableArea` directly without the prop
 * leaking onto the DOM.
 */
export const PlainDivActionable: Story = {
	args: {
		layout: [
			{ key: 'a', width: 3, height: 1, order: 0 },
			{ key: 'b', width: 3, height: 1, order: 1 },
		],
		columns: 6,
		rowHeight: 80,
		editMode: true,
		children: [
			/*
			 * `actionableArea` is a grid-level slot, not an HTML attribute.
			 * It's spread onto the element here rather than written as a
			 * named prop because HTML types reject unknown props; the grid
			 * lifts it into its own slot and strips it from the child
			 * before rendering, so it never reaches the DOM.
			 */
			<div
				key="a"
				{ ...( {
					actionableArea: (
						<div
							style={ {
								position: 'absolute',
								top: 4,
								right: 4,
								zIndex: 2,
							} }
						>
							<IconButton
								size="small"
								variant="solid"
								tone="neutral"
								icon={ close }
								label="Remove"
							/>
						</div>
					),
				} as React.HTMLAttributes< HTMLDivElement > ) }
				style={ {
					backgroundColor: bgTokens.brand,
					color: fgTokens.brand,
					padding: 20,
					height: '100%',
					boxSizing: 'border-box',
				} }
			>
				Plain div + actionableArea
			</div>,
			<div
				key="b"
				style={ {
					backgroundColor: bgTokens.info,
					color: fgTokens.info,
					padding: 20,
					height: '100%',
					boxSizing: 'border-box',
				} }
			>
				Plain div, no actionableArea
			</div>,
		],
	},
};
