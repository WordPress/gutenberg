/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Slot, Fill, Provider as SlotFillProvider } from '../';

const meta: ComponentMeta< typeof Slot > = {
	component: Slot,
	title: 'Components/SlotFill',
	subcomponents: { Fill, SlotFillProvider },
	argTypes: {
		name: { control: { type: null } },
		as: { control: { type: 'text' } },
		fillProps: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

export default meta;

export const Default: ComponentStory< typeof Slot > = ( props ) => {
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
	className: 'my-slot',
	bubblesVirtually: true,
	as: 'span',
};

export const WithFillProps: ComponentStory< typeof Slot > = ( props ) => {
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

export const WithSlotChildren: ComponentStory< typeof Slot > = ( props ) => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name: { /* @ts-ignore */ }
				<Slot { ...props } name="name">
					{ ( fills ) => {
						return (
							<span style={ { color: 'red' } }>{ fills }</span>
						);
					} }
				</Slot>
			</p>
			<p>
				Age: { /* @ts-ignore */ }
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

export const WithContext: ComponentStory< typeof Slot > = ( props ) => {
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
