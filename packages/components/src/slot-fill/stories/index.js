/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Slot, Fill, Provider as SlotFillProvider } from '../';

export default {
	title: 'Components/SlotFill',
	subcomponents: { Fill, SlotFillProvider },
	component: Slot,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

export const _default = () => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name: <Slot bubblesVirtually as="span" name="name" />
			</p>
			<p>
				Age: <Slot bubblesVirtually as="span" name="age" />
			</p>
			<Fill name="name">Grace</Fill>
			<Fill name="age">33</Fill>
		</SlotFillProvider>
	);
};

export const withFillProps = () => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name:{ ' ' }
				<Slot
					bubblesVirtually
					as="span"
					name="name"
					fillProps={ { name: 'Grace' } }
				/>
			</p>
			<p>
				Age:{ ' ' }
				<Slot
					bubblesVirtually
					as="span"
					name="age"
					fillProps={ { age: 33 } }
				/>
			</p>
			<Fill name="name">{ ( fillProps ) => fillProps.name }</Fill>
			<Fill name="age">{ ( fillProps ) => fillProps.age }</Fill>
		</SlotFillProvider>
	);
};

export const withContext = () => {
	const Context = createContext();
	const ContextFill = ( { name } ) => {
		const value = useContext( Context );
		return <Fill name={ name }>{ value }</Fill>;
	};
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>
				Name: <Slot bubblesVirtually as="span" name="name" />
			</p>
			<p>
				Age: <Slot bubblesVirtually as="span" name="age" />
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
