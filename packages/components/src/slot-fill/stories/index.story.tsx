/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Slot, Fill, Provider as SlotFillProvider } from '../';

const meta: Meta< typeof Slot > = {
	component: Slot,
	title: 'Components/Utilities/SlotFill',
	id: 'components-slotfill',
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { Fill, SlotFillProvider },
	argTypes: {
		name: { control: false },
		as: { control: { type: 'text' } },
		fillProps: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

export default meta;

export const Default: StoryFn< typeof Slot > = ( props ) => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name: <Slot { ...props } name="name" />
			</p>
			<p>
				Age: <Slot { ...props } name="age" />
			</p>
			<Fill name="name">Grace</Fill>
			<Fill name="age">33</Fill>
		</SlotFillProvider>
	);
};
Default.args = {
	bubblesVirtually: true,
	as: 'span',
};

export const WithFillProps: StoryFn< typeof Slot > = ( props ) => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name:{ ' ' }
				<Slot
					{ ...props }
					name="name"
					fillProps={ { name: 'Grace' } }
				/>
			</p>
			<p>
				Age: <Slot { ...props } name="age" fillProps={ { age: 33 } } />
			</p>

			<Fill name="name">{ ( fillProps ) => fillProps.name }</Fill>
			<Fill name="age">{ ( fillProps ) => fillProps.age }</Fill>
		</SlotFillProvider>
	);
};
WithFillProps.args = {
	...Default.args,
};

export const WithSlotChildren: StoryFn< typeof Slot > = ( props ) => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name:
				{ /* @ts-expect-error Not supported children for `<Slot />` when `bubblesVirtually` is true. */ }
				<Slot { ...props } name="name">
					{ ( fills ) => {
						return (
							<span style={ { color: 'red' } }>{ fills }</span>
						);
					} }
				</Slot>
			</p>
			<p>
				Age:
				{ /* @ts-expect-error Not support children for `<Slot />` when `bubblesVirtually` is true. */ }
				<Slot { ...props } name="age">
					{ ( fills ) => {
						return (
							<span style={ { color: 'red' } }>{ fills }</span>
						);
					} }
				</Slot>
			</p>
			<Fill name="name">Alice</Fill>
			<Fill name="age">18</Fill>
		</SlotFillProvider>
	);
};
WithSlotChildren.args = {
	...Default.args,
};

export const WithContext: StoryFn< typeof Slot > = ( props ) => {
	const Context = createContext< string | number >( '' );
	const ContextFill = ( { name }: { name: string } ) => {
		const value = useContext( Context );
		return <Fill name={ name }>{ value }</Fill>;
	};
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name: <Slot { ...props } name="name" />
			</p>
			<p>
				Age: <Slot { ...props } name="age" />
			</p>
			<Context.Provider value="Grace">
				<ContextFill name="name" />
			</Context.Provider>
			<Context.Provider value={ 33 }>
				<ContextFill name="age" />
			</Context.Provider>
		</SlotFillProvider>
	);
};
WithContext.args = {
	...Default.args,
};
