/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CircularOptionPickerContext } from './circular-option-picker-context';
import { Composite, useCompositeStore } from '../composite/v2';
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
	props: ListboxCircularOptionPickerProps
) {
	const {
		actions,
		options,
		baseId,
		className,
		loop = true,
		children,
		...additionalProps
	} = props;

	const compositeStore = useCompositeStore( {
		focusLoop: loop,
		rtl: isRTL(),
	} );

	const compositeContext = {
		baseId,
		compositeStore,
	};

	return (
		<div className={ className }>
			<CircularOptionPickerContext.Provider value={ compositeContext }>
				<Composite
					{ ...additionalProps }
					id={ baseId }
					store={ compositeStore }
					role={ 'listbox' }
				>
					{ options }
				</Composite>
				{ children }
				{ actions }
			</CircularOptionPickerContext.Provider>
		</div>
	);
}

function ButtonsCircularOptionPicker(
	props: ButtonsCircularOptionPickerProps
) {
	const { actions, options, children, baseId, ...additionalProps } = props;

	return (
		<div { ...additionalProps } id={ baseId }>
			<CircularOptionPickerContext.Provider value={ { baseId } }>
				{ options }
				{ children }
				{ actions }
			</CircularOptionPickerContext.Provider>
		</div>
	);
}

function CircularOptionPicker( props: CircularOptionPickerProps ) {
	const {
		asButtons,
		actions: actionsProp,
		options: optionsProp,
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

	const actions = actionsProp ? (
		<div className="components-circular-option-picker__custom-clear-wrapper">
			{ actionsProp }
		</div>
	) : undefined;

	const options = (
		<div className={ 'components-circular-option-picker__swatches' }>
			{ optionsProp }
		</div>
	);

	return (
		<OptionPickerImplementation
			{ ...additionalProps }
			baseId={ baseId }
			className={ clsx( 'components-circular-option-picker', className ) }
			actions={ actions }
			options={ options }
		>
			{ children }
		</OptionPickerImplementation>
	);
}

CircularOptionPicker.Option = Option;
CircularOptionPicker.OptionGroup = OptionGroup;
CircularOptionPicker.ButtonAction = ButtonAction;
CircularOptionPicker.DropdownLinkAction = DropdownLinkAction;

export default CircularOptionPicker;
