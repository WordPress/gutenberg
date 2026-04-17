/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Grid } from '../grid';
import type { GridLayoutItem } from '../types';

const meta: Meta< typeof Grid > = {
	title: 'Design System/Components/Grid',
	component: Grid,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		children: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof Grid >;

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

function WidgetActions( { onClose }: { onClose: () => void } ) {
	return (
		<div
			style={ {
				position: 'absolute',
				display: 'flex',
				alignItems: 'right',
				justifyContent: 'right',
				top: 2,
				right: 2,
				zIndex: 2,
			} }
		>
			<button onClick={ onClose }>x</button>
		</div>
	);
}

function LayoutStatePanel( { layout }: { layout: GridLayoutItem[] } ) {
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
	parameters: { layout: '' },
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
	parameters: { layout: '' },
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
	parameters: { layout: '' },
	render: function EditModeStory() {
		const [ layout, setLayout ] = useState< GridLayoutItem[] >( [
			{ key: 'fill', fillWidth: true, height: 1, order: 1 },
			{ key: 'fixed-1', width: 1, height: 1, order: 2 },
			{ key: 'fixed-2', width: 5, height: 1, order: 3 },
			{ key: 'full', fullWidth: true, height: 1, order: 4 },
			{ key: 'fixed-3', width: 2, height: 1, order: 5 },
			{ key: 'fixed-4', width: 2, height: 1, order: 6 },
		] );

		const removeTile = ( key: string ) => {
			setLayout( layout.filter( ( item ) => item.key !== key ) );
		};

		return (
			<div style={ { width: '800px' } }>
				<Grid
					layout={ layout }
					columns={ 6 }
					rowHeight={ 80 }
					spacing={ 2 }
					editMode
					onChangeLayout={ setLayout }
				>
					<Tile
						key="fill"
						tone="info"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fill' ) }
							/>
						}
					>
						fillWidth — resize me
					</Tile>
					<Tile
						key="fixed-1"
						tone="success"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-1' ) }
							/>
						}
					>
						width: 1
					</Tile>
					<Tile
						key="fixed-2"
						tone="brand"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-2' ) }
							/>
						}
					>
						width: 5
					</Tile>
					<Tile
						key="full"
						tone="neutral"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'full' ) }
							/>
						}
					>
						fullWidth — resize me
					</Tile>
					<Tile
						key="fixed-3"
						tone="warning"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-3' ) }
							/>
						}
					>
						width: 2
					</Tile>
					<Tile
						key="fixed-4"
						tone="error"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-4' ) }
							/>
						}
					>
						width: 2
					</Tile>
				</Grid>

				<LayoutStatePanel layout={ layout } />
			</div>
		);
	},
};
