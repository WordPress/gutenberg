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
	title: 'Grid',
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

function Card( {
	color,
	children,
	actionableArea,
	...props
}: {
	color: string;
	children: React.ReactNode;
	actionableArea?: React.ReactNode;
} & React.HTMLAttributes< HTMLDivElement > ) {
	return (
		<div
			{ ...props }
			style={ {
				backgroundColor: color,
				color: 'white',
				padding: '20px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				boxSizing: 'border-box',
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
				background: '#f5f5f5',
				borderRadius: 4,
				fontFamily: 'monospace',
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
 * Static grid with a fixed number of columns.
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
			<Card key="a" color="#f44336">
				width: 1
			</Card>,
			<Card key="b" color="#2196f3">
				width: 3
			</Card>,
			<Card key="c" color="#4caf50">
				width: 2
			</Card>,
			<Card key="d" color="#ff9800">
				width: 4
			</Card>,
			<Card key="e" color="#9c27b0">
				width: 2
			</Card>,
		],
	},
};

/**
 * Responsive grid that adapts column count based on container width.
 * Combines all three width modes: fixed, fillWidth, and fullWidth.
 */
export const Responsive: Story = {
	parameters: { layout: '' },
	args: {
		layout: [
			{ key: 'fill', fillWidth: true, height: 1, order: 1 },
			{ key: 'fixed-1', width: 1, height: 1, order: 2 },
			{ key: 'fixed-2', width: 2, height: 1, order: 3 },
			{ key: 'fixed-3', width: 2, height: 1, order: 4 },
			{ key: 'fixed-4', width: 2, height: 1, order: 5 },
			{
				key: 'full',
				fullWidth: true,
				height: 1,
				order: 6,
			},
			{ key: 'fixed-5', width: 1, height: 1, order: 7 },
			{ key: 'fixed-6', width: 1, height: 1, order: 8 },
			{
				key: 'fill-2',
				fillWidth: true,
				height: 1,
				order: 9,
			},
		],
		rowHeight: 96,
		minColumnWidth: 192,
		children: [
			<Card key="fill" color="#2196f3">
				fillWidth
			</Card>,
			<Card key="fixed-1" color="#4caf50">
				width: 1
			</Card>,
			<Card key="fixed-2" color="#f44336">
				width: 2
			</Card>,
			<Card key="fixed-3" color="#ff9800">
				width: 2
			</Card>,
			<Card key="fixed-4" color="#9c27b0">
				width: 2
			</Card>,
			<Card key="full" color="#607d8b">
				fullWidth
			</Card>,
			<Card key="fixed-5" color="#795548">
				width: 1
			</Card>,
			<Card key="fixed-6" color="#e91e63">
				width: 1
			</Card>,
			<Card key="fill-2" color="#00bcd4">
				fillWidth
			</Card>,
		],
	},
};

/**
 * Numeric row height with multi-row items.
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
			<Card key="a" color="#f44336">
				2 cols x 2 rows
			</Card>,
			<Card key="b" color="#2196f3">
				2 cols x 1 row
			</Card>,
			<Card key="c" color="#4caf50">
				2 cols x 3 rows
			</Card>,
			<Card key="d" color="#ff9800">
				4 cols x 1 row
			</Card>,
			<Card key="e" color="#9c27b0">
				2 cols x 1 row
			</Card>,
		],
	},
};

/**
 * Edit mode with drag, resize, and all width modes.
 * A state panel shows the raw layout JSON. Drag items to reorder,
 * resize from the bottom-right handle.
 */
export const EditMode: Story = {
	parameters: { layout: '' },
	render: function EditModeStory() {
		const [ layout, setLayout ] = useState< GridLayoutItem[] >( [
			{
				key: 'fill',
				fillWidth: true,
				height: 1,
				order: 1,
			},
			{ key: 'fixed-1', width: 1, height: 1, order: 2 },
			{ key: 'fixed-2', width: 5, height: 1, order: 3 },
			{
				key: 'full',
				fullWidth: true,
				height: 1,
				order: 4,
			},
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
					<Card
						key="fill"
						color="#2196f3"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fill' ) }
							/>
						}
					>
						fillWidth — resize me
					</Card>
					<Card
						key="fixed-1"
						color="#4caf50"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-1' ) }
							/>
						}
					>
						width: 1
					</Card>
					<Card
						key="fixed-2"
						color="#f44336"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-2' ) }
							/>
						}
					>
						width: 2
					</Card>
					<Card
						key="full"
						color="#607d8b"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'full' ) }
							/>
						}
					>
						fullWidth — resize me
					</Card>
					<Card
						key="fixed-3"
						color="#ff9800"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-3' ) }
							/>
						}
					>
						width: 2
					</Card>
					<Card
						key="fixed-4"
						color="#9c27b0"
						actionableArea={
							<WidgetActions
								onClose={ () => removeTile( 'fixed-4' ) }
							/>
						}
					>
						width: 2
					</Card>
				</Grid>

				<LayoutStatePanel layout={ layout } />
			</div>
		);
	},
};
