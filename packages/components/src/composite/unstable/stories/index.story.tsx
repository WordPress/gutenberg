/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

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

type InitialState = Parameters< typeof useCompositeState >[ 0 ];

const Placeholder = ( _: InitialState ) => <></>;

const meta: Meta< typeof Placeholder > = {
	title: 'Components/Composite/Composite (Unstable)',
	id: 'components-composite-unstable',
	component: Placeholder,
	args: {
		rtl: isRTL(),
		loop: false,
		shift: false,
		wrap: false,
	},
	argTypes: { ...Legacy.argTypes },
};
export default meta;

export const TwoDimensionsWithStateProp: StoryFn< typeof Placeholder > = (
	initialState
) => {
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

export const TwoDimensionsWithSpreadProps: StoryFn< typeof Placeholder > = (
	initialState
) => {
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

export const OneDimensionWithStateProp: StoryFn< typeof Placeholder > = (
	initialState
) => {
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

export const OneDimensionWithSpreadProps: StoryFn< typeof Placeholder > = (
	initialState
) => {
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
