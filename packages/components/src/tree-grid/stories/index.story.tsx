/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGrid, { TreeGridRow, TreeGridCell } from '..';
import { Button } from '../../button';
import InputControl from '../../input-control';

const meta: Meta< typeof TreeGrid > = {
	title: 'Components/Navigation/TreeGrid',
	id: 'components-treegrid',
	component: TreeGrid,
	subcomponents: { TreeGridRow, TreeGridCell },
	argTypes: {
		children: { control: false },
	},
	tags: [ 'status-experimental' ],
	args: {
		onExpandRow: fn(),
		onCollapseRow: fn(),
		onFocusRow: fn(),
	},
	parameters: {
		controls: { expanded: true },
		componentStatus: {
			status: 'stable',
			whereUsed: 'global',
		},
	},
};
export default meta;

const groceries = [
	{
		name: 'Fruit',
		types: [
			{
				name: 'Apple',
			},
			{
				name: 'Orange',
			},
			{
				name: 'Pear',
			},
		],
	},
	{
		name: 'Vegetable',
		types: [
			{
				name: 'Cucumber',
			},
			{
				name: 'Parsnip',
			},
			{
				name: 'Pumpkin',
			},
		],
	},
];

const Descender = ( { level }: { level: number } ) => {
	if ( level === 1 ) {
		return null;
	}
	const indentation = '\u00A0'.repeat( ( level - 1 ) * 4 );

	return <span aria-hidden="true">{ indentation + '├ ' }</span>;
};

type Item = {
	name: string;
	types?: Item[];
};

const Rows = ( {
	items = [],
	level = 1,
}: {
	items?: Item[];
	level?: number;
} ) => {
	return (
		<>
			{ items.map( ( item, index ) => {
				const hasChildren = !! item.types && !! item.types.length;
				return (
					<Fragment key={ item.name }>
						<TreeGridRow
							positionInSet={ index + 1 }
							setSize={ items.length }
							level={ level }
							isExpanded
						>
							<TreeGridCell>
								{ ( props ) => (
									<>
										<Descender level={ level } />
										<Button
											__next40pxDefaultSize
											variant="primary"
											{ ...props }
										>
											{ item.name }
										</Button>
									</>
								) }
							</TreeGridCell>
							<TreeGridCell>
								{ ( props ) => (
									<InputControl
										label="Description"
										hideLabelFromVision
										placeholder="Description"
										__next40pxDefaultSize
										{ ...props }
									/>
								) }
							</TreeGridCell>
							<TreeGridCell>
								{ ( props ) => (
									<InputControl
										label="Notes"
										hideLabelFromVision
										placeholder="Notes"
										__next40pxDefaultSize
										{ ...props }
									/>
								) }
							</TreeGridCell>
						</TreeGridRow>
						{ hasChildren && (
							<Rows items={ item.types } level={ level + 1 } />
						) }
					</Fragment>
				);
			} ) }
		</>
	);
};

const Template: StoryFn< typeof TreeGrid > = ( args ) => (
	<TreeGrid { ...args } />
);

export const Default = Template.bind( {} );
Default.args = {
	children: <Rows items={ groceries } />,
};
