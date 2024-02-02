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

import Legacy from '../../legacy/stories/index.story';
import { UseCompositeStatePlaceholder, transform } from './utils';

Composite.displayName = 'Composite';
CompositeGroup.displayName = 'CompositeGroup';
CompositeItem.displayName = 'CompositeItem';

const meta: Meta< typeof UseCompositeStatePlaceholder > = {
	title: 'Components/Composite',
	component: UseCompositeStatePlaceholder,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Composite,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CompositeGroup,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CompositeItem,
	},
	argTypes: { ...Legacy.argTypes },
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			source: { transform },
		},
	},
	decorators: [
		// Because of the way Reakit caches state, this is a hack to make sure
		// stories update when config is changed.
		( Story ) => (
			<div key={ Math.random() }>
				<Story />
			</div>
		),
	],
};
export default meta;

export const TwoDimensionsWithStateProp: StoryFn<
	typeof UseCompositeStatePlaceholder
> = ( initialState ) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			state={ state }
			aria-label="Legacy Composite with state prop (two dimensions)"
		>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state }>Item A1</CompositeItem>
				<CompositeItem state={ state }>Item A2</CompositeItem>
				<CompositeItem state={ state }>Item A3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state }>Item B1</CompositeItem>
				<CompositeItem state={ state }>Item B2</CompositeItem>
				<CompositeItem state={ state }>Item B3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state }>Item C1</CompositeItem>
				<CompositeItem state={ state }>Item C2</CompositeItem>
				<CompositeItem state={ state }>Item C3</CompositeItem>
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
			{ ...state }
			aria-label="Legacy Composite with spread props (two dimensions)"
		>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state }>Item A1</CompositeItem>
				<CompositeItem { ...state }>Item A2</CompositeItem>
				<CompositeItem { ...state }>Item A3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state }>Item B1</CompositeItem>
				<CompositeItem { ...state }>Item B2</CompositeItem>
				<CompositeItem { ...state }>Item B3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state }>Item C1</CompositeItem>
				<CompositeItem { ...state }>Item C2</CompositeItem>
				<CompositeItem { ...state }>Item C3</CompositeItem>
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
			state={ state }
			aria-label="Legacy Composite with state prop (one dimension)"
		>
			<CompositeItem state={ state }>Item 1</CompositeItem>
			<CompositeItem state={ state }>Item 2</CompositeItem>
			<CompositeItem state={ state }>Item 3</CompositeItem>
			<CompositeItem state={ state }>Item 4</CompositeItem>
			<CompositeItem state={ state }>Item 5</CompositeItem>
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
			{ ...state }
			aria-label="Legacy Composite with spread props (one dimension)"
		>
			<CompositeItem { ...state }>Item 1</CompositeItem>
			<CompositeItem { ...state }>Item 2</CompositeItem>
			<CompositeItem { ...state }>Item 3</CompositeItem>
			<CompositeItem { ...state }>Item 4</CompositeItem>
			<CompositeItem { ...state }>Item 5</CompositeItem>
		</Composite>
	);
};
OneDimensionWithSpreadProps.args = {};
