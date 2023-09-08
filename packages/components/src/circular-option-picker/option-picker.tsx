/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CircularOptionPickerContext } from './option-picker-context';
import { Composite, useCompositeState } from '../composite';
import type {
	CircularOptionPickerProps,
	ListboxCircularOptionPickerProps,
	ButtonsCircularOptionPickerProps,
} from './types';
import { Option } from './option-picker-option';
import { OptionGroup } from './option-picker-option-group';
import { ButtonAction, DropdownLinkAction } from './option-picker-actions';

/**
 *`CircularOptionPicker` is a component that displays a set of options as circular buttons.
 *
 * ```jsx
 * import { CircularOptionPicker } from '../circular-option-picker';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 * 	const [ currentColor, setCurrentColor ] = useState();
 * 	const colors = [
 * 		{ color: '#f00', name: 'Red' },
 * 		{ color: '#0f0', name: 'Green' },
 * 		{ color: '#00f', name: 'Blue' },
 * 	];
 * 	const colorOptions = (
 * 		<>
 * 			{ colors.map( ( { color, name }, index ) => {
 * 				return (
 * 					<CircularOptionPicker.Option
 * 						key={ `${ color }-${ index }` }
 * 						tooltipText={ name }
 * 						style={ { backgroundColor: color, color } }
 * 						isSelected={ index === currentColor }
 * 						onClick={ () => setCurrentColor( index ) }
 * 						aria-label={ name }
 * 					/>
 * 				);
 * 			} ) }
 * 		</>
 * 	);
 * 	return (
 * 		<CircularOptionPicker
 * 				options={ colorOptions }
 * 				actions={
 * 					<CircularOptionPicker.ButtonAction
 * 						onClick={ () => setCurrentColor( undefined ) }
 * 					>
 * 						{ 'Clear' }
 * 					</CircularOptionPicker.ButtonAction>
 * 				}
 * 			/>
 * 	);
 * };
 * ```
 */

function ListboxCircularOptionPicker(
	props: Omit<
		ListboxCircularOptionPickerProps,
		'asButtons' | 'actions' | 'options'
	>
) {
	const { id, disableLooping, children, ...additionalProps } = props;
	const baseId = useInstanceId( CircularOptionPicker, 'option-picker', id );
	const rtl = isRTL();
	const loop = ! disableLooping;

	const compositeState = useCompositeState( { baseId, loop, rtl } );

	// This is necessary as `useCompositeState` is sealed after
	// the first render, so although unlikely to happen, if a state
	// property should change, we need to process it accordingly.
	useEffect( () => {
		compositeState.setBaseId( baseId );
		compositeState.setLoop( !! loop );
		compositeState.setRTL( rtl );
		// Disabling exhaustive-deps check because it expects
		// `compositeState` to be present, but doing so causes
		// an infinite loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ baseId, loop, rtl ] );

	return (
		<Composite
			{ ...additionalProps }
			{ ...compositeState }
			role={ 'listbox' }
		>
			<CircularOptionPickerContext.Provider value={ compositeState }>
				{ children }
			</CircularOptionPickerContext.Provider>
		</Composite>
	);
}

function ButtonsCircularOptionPicker(
	props: Omit<
		ButtonsCircularOptionPickerProps,
		'asButtons' | 'actions' | 'options'
	>
) {
	const { children, ...additionalProps } = props;

	// We're including an empty context here, so as to prevent
	// any nesting issues.
	return (
		<div { ...additionalProps }>
			<CircularOptionPickerContext.Provider value={ {} }>
				{ children }
			</CircularOptionPickerContext.Provider>
		</div>
	);
}

function CircularOptionPicker( props: CircularOptionPickerProps ) {
	const {
		asButtons,
		actions,
		options,
		children,
		className,
		...additionalProps
	} = props;

	const OptionPickerImplementation = asButtons
		? ButtonsCircularOptionPicker
		: ListboxCircularOptionPicker;

	return (
		<OptionPickerImplementation
			{ ...additionalProps }
			className={ classnames(
				'components-circular-option-picker',
				className
			) }
		>
			<div className={ 'components-circular-option-picker__swatches' }>
				{ options }
			</div>
			{ children }
			{ actions && (
				<div className="components-circular-option-picker__custom-clear-wrapper">
					{ actions }
				</div>
			) }
		</OptionPickerImplementation>
	);
}

CircularOptionPicker.Option = Option;
CircularOptionPicker.OptionGroup = OptionGroup;
CircularOptionPicker.ButtonAction = ButtonAction;
CircularOptionPicker.DropdownLinkAction = DropdownLinkAction;

export default CircularOptionPicker;
