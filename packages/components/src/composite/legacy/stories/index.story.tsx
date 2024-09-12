/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import {
	Composite,
	CompositeGroup,
	CompositeItem,
	useCompositeState,
} from '..';
import { UseCompositeStatePlaceholder, transform } from './utils';

const meta: Meta< typeof UseCompositeStatePlaceholder > = {
	title: 'Components (Deprecated)/Composite (Unstable)',
	id: 'components-composite-unstable',
	component: UseCompositeStatePlaceholder,
	subcomponents: {
		Composite,
		CompositeGroup,
		CompositeItem,
	},
	args: {},
	parameters: {
		controls: { exclude: /^unstable_/ },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { transform },
		},
	},
	argTypes: {
		orientation: { control: 'select' },
		loop: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical' ],
		},
		wrap: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical' ],
		},
	},
};
export default meta;

export const TwoDimensionsWithStateProp: StoryFn<
	typeof UseCompositeStatePlaceholder
> = ( initialState ) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			role="grid"
			state={ state }
			aria-label="Legacy Composite with state prop (two dimensions)"
		>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state } role="gridcell">
					Item A1
				</CompositeItem>
				<CompositeItem state={ state } role="gridcell">
					Item A2
				</CompositeItem>
				<CompositeItem state={ state } role="gridcell">
					Item A3
				</CompositeItem>
			</CompositeGroup>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state } role="gridcell">
					Item B1
				</CompositeItem>
				<CompositeItem state={ state } role="gridcell">
					Item B2
				</CompositeItem>
				<CompositeItem state={ state } role="gridcell">
					Item B3
				</CompositeItem>
			</CompositeGroup>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state } role="gridcell">
					Item C1
				</CompositeItem>
				<CompositeItem state={ state } role="gridcell">
					Item C2
				</CompositeItem>
				<CompositeItem state={ state } role="gridcell">
					Item C3
				</CompositeItem>
			</CompositeGroup>
		</Composite>
	);
};
TwoDimensionsWithStateProp.args = {};

export const TwoDimensionsWithSpreadProps: StoryFn<
	typeof UseCompositeStatePlaceholder
> = ( initialState ) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			role="grid"
			{ ...state }
			aria-label="Legacy Composite with spread props (two dimensions)"
		>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state } role="gridcell">
					Item A1
				</CompositeItem>
				<CompositeItem { ...state } role="gridcell">
					Item A2
				</CompositeItem>
				<CompositeItem { ...state } role="gridcell">
					Item A3
				</CompositeItem>
			</CompositeGroup>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state } role="gridcell">
					Item B1
				</CompositeItem>
				<CompositeItem { ...state } role="gridcell">
					Item B2
				</CompositeItem>
				<CompositeItem { ...state } role="gridcell">
					Item B3
				</CompositeItem>
			</CompositeGroup>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state } role="gridcell">
					Item C1
				</CompositeItem>
				<CompositeItem { ...state } role="gridcell">
					Item C2
				</CompositeItem>
				<CompositeItem { ...state } role="gridcell">
					Item C3
				</CompositeItem>
			</CompositeGroup>
		</Composite>
	);
};
TwoDimensionsWithSpreadProps.args = {};

export const OneDimensionWithStateProp: StoryFn<
	typeof UseCompositeStatePlaceholder
> = ( initialState ) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			role="list"
			state={ state }
			aria-label="Legacy Composite with state prop (one dimension)"
		>
			<CompositeItem state={ state } role="listitem">
				Item 1
			</CompositeItem>
			<CompositeItem state={ state } role="listitem">
				Item 2
			</CompositeItem>
			<CompositeItem state={ state } role="listitem">
				Item 3
			</CompositeItem>
			<CompositeItem state={ state } role="listitem">
				Item 4
			</CompositeItem>
			<CompositeItem state={ state } role="listitem">
				Item 5
			</CompositeItem>
		</Composite>
	);
};
OneDimensionWithStateProp.args = {};

export const OneDimensionWithSpreadProps: StoryFn<
	typeof UseCompositeStatePlaceholder
> = ( initialState ) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			role="list"
			{ ...state }
			aria-label="Legacy Composite with spread props (one dimension)"
		>
			<CompositeItem { ...state } role="listitem">
				Item 1
			</CompositeItem>
			<CompositeItem { ...state } role="listitem">
				Item 2
			</CompositeItem>
			<CompositeItem { ...state } role="listitem">
				Item 3
			</CompositeItem>
			<CompositeItem { ...state } role="listitem">
				Item 4
			</CompositeItem>
			<CompositeItem { ...state } role="listitem">
				Item 5
			</CompositeItem>
		</Composite>
	);
};
OneDimensionWithSpreadProps.args = {};
