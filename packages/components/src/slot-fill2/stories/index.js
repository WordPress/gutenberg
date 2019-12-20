/**
 * External dependencies
 */
import { text, number } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Slot, Fill, SlotFillProvider } from '../';

export default { title: 'Components|SlotFill', component: Slot };

export const _default = () => {
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>Name: <Slot as="span" name="name" /></p>
			<p>Age: <Slot as="span" name="age" /></p>
			<Fill name="name">Grace</Fill>
			<Fill name="age">33</Fill>
		</SlotFillProvider>
	);
};

export const withFillProps = () => {
	const name = text( 'name', 'Grace' );
	const age = number( 'age', 33 );
	return (
		<SlotFillProvider>
			<h2>Profile</h2>
			<p>Name: <Slot as="span" name="name" fillProps={ { name } } /></p>
			<p>Age: <Slot as="span" name="age" fillProps={ { age } } /></p>
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
			<p>Name: <Slot as="span" name="name" /></p>
			<p>Age: <Slot as="span" name="age" /></p>
			<Context.Provider value="Grace">
				<ContextFill name="name" />
			</Context.Provider>
			<Context.Provider value={ 33 }>
				<ContextFill name="age" />
			</Context.Provider>
		</SlotFillProvider>
	);
};
