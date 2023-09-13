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
import { CircularOptionPickerContext } from './circular-option-picker-context';
import { Composite, useCompositeState } from '../composite';
import type {
	CircularOptionPickerProps,
	ListboxCircularOptionPickerProps,
	ButtonsCircularOptionPickerProps,
} from './types';
import { Option } from './circular-option-picker-option';
import { OptionGroup } from './circular-option-picker-option-group';
import {
	ButtonAction,
	DropdownLinkAction,
} from './circular-option-picker-actions';

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
	> & { baseId: string }
) {
	const { baseId, loop = true, children, ...additionalProps } = props;
	const rtl = isRTL();

	const compositeState = useCompositeState( { baseId, loop, rtl } );

	// These are necessary as `useCompositeState` is sealed after
	// the first render, so although unlikely to happen, if a state
	// property should change, we need to process it accordingly.

	useEffect( () => {
		compositeState.setBaseId( baseId );
		// Disabling exhaustive-deps check because it expects
		// `compositeState` to be present, but doing so causes
		// an infinite loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ baseId ] );

	useEffect( () => {
		compositeState.setLoop( !! loop );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ loop ] );

	useEffect( () => {
		compositeState.setRTL( rtl );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ rtl ] );

	const compositeContext = {
		isComposite: true,
		...compositeState,
	};

	return (
		<Composite
			{ ...additionalProps }
			{ ...compositeState }
			role={ 'listbox' }
		>
			<CircularOptionPickerContext.Provider value={ compositeContext }>
				{ children }
			</CircularOptionPickerContext.Provider>
		</Composite>
	);
}

function ButtonsCircularOptionPicker(
	props: Omit<
		ButtonsCircularOptionPickerProps,
		'asButtons' | 'actions' | 'options'
	> & { baseId: string }
) {
	const { children, baseId, ...additionalProps } = props;

	return (
		<div { ...additionalProps }>
			<CircularOptionPickerContext.Provider
				value={ { isComposite: false, baseId } }
			>
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

	const baseId = useInstanceId(
		CircularOptionPicker,
		'components-circular-option-picker',
		additionalProps.id
	);

	const OptionPickerImplementation = asButtons
		? ButtonsCircularOptionPicker
		: ListboxCircularOptionPicker;

	return (
		<OptionPickerImplementation
			{ ...additionalProps }
			baseId={ baseId }
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
