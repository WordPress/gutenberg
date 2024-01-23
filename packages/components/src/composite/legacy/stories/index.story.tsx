/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import {
	Composite,
	CompositeItem,
	CompositeGroup,
	useCompositeState,
} from '..';
import { UseCompositeStatePlaceholder, transform } from './utils';

const meta: Meta< typeof UseCompositeStatePlaceholder > = {
	title: 'Components/Composite/Composite (Legacy)',
	id: 'components-composite-legacy',
	component: UseCompositeStatePlaceholder,
	args: {},
	parameters: { controls: { exclude: /^unstable_/ } },
	argTypes: {
		orientation: { control: 'select' },
		rtl: { control: 'select', options: [ true, false ] },
		shift: { control: 'select', options: [ true, false ] },
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
TwoDimensionsWithStateProp.parameters = {
	docs: { source: { transform } },
};

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
TwoDimensionsWithSpreadProps.parameters = {
	docs: { source: { transform } },
};

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
OneDimensionWithStateProp.parameters = {
	docs: { source: { transform } },
};

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
OneDimensionWithSpreadProps.parameters = {
	docs: { source: { transform } },
};
