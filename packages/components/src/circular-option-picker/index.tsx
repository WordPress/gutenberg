/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import {
	Composite,
	CompositeGroup,
	CompositeItem,
	useCompositeState,
} from '../composite';
import Dropdown from '../dropdown';
import Tooltip from '../tooltip';
import type {
	CircularOptionPickerProps,
	DropdownLinkActionProps,
	OptionGroupProps,
	OptionProps,
} from './types';
import type { WordPressComponentProps } from '../ui/context';
import type { ButtonAsButtonProps } from '../button/types';

const CircularOptionPickerContext = createContext( {} );

export function Option( {
	className,
	isSelected,
	selectedIconProps,
	tooltipText,
	...additionalProps
}: OptionProps ) {
	const compositeState = useContext( CircularOptionPickerContext );

	const optionControl = (
		<CompositeItem
			as={ Button }
			className={ 'components-circular-option-picker__option' }
			isPressed={ isSelected }
			{ ...additionalProps }
			{ ...compositeState }
		/>
	);

	return (
		<div
			className={ classnames(
				className,
				'components-circular-option-picker__option-wrapper'
			) }
		>
			{ tooltipText ? (
				<Tooltip text={ tooltipText }>{ optionControl }</Tooltip>
			) : (
				optionControl
			) }
			{ isSelected && (
				<Icon
					icon={ check }
					{ ...( selectedIconProps ? selectedIconProps : {} ) }
				/>
			) }
		</div>
	);
}

export function OptionGroup( {
	className,
	options,
	...additionalProps
}: OptionGroupProps ) {
	const compositeState = useContext( CircularOptionPickerContext );

	// This is unlikely to happen, but on the off-chance that we've ended up
	// with a list of `OptionGroup`s, we will just return those instead.
	if ( Array.isArray( options ) && options[ 0 ] instanceof OptionGroup ) {
		return <>options</>;
	}

	return (
		<CompositeGroup
			role={ 'group' }
			{ ...additionalProps }
			{ ...compositeState }
			className={ classnames(
				'components-circular-option-picker__swatches',
				className
			) }
		>
			{ options }
		</CompositeGroup>
	);
}

export function DropdownLinkAction( {
	buttonProps,
	className,
	dropdownProps,
	linkText,
}: DropdownLinkActionProps ) {
	return (
		<Dropdown
			className={ classnames(
				'components-circular-option-picker__dropdown-link-action',
				className
			) }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					variant="link"
					{ ...buttonProps }
				>
					{ linkText }
				</Button>
			) }
			{ ...dropdownProps }
		/>
	);
}

export function ButtonAction( {
	className,
	children,
	...additionalProps
}: WordPressComponentProps< ButtonAsButtonProps, 'button', false > ) {
	return (
		<Button
			className={ classnames(
				'components-circular-option-picker__clear',
				className
			) }
			variant="tertiary"
			{ ...additionalProps }
		>
			{ children }
		</Button>
	);
}

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

function CircularOptionPicker( props: CircularOptionPickerProps ) {
	const { actions, className, options, children, loop = true } = props;
	const compositeState = useCompositeState( { loop } );

	return (
		<Composite
			{ ...compositeState }
			role={ 'listbox' }
			className={ classnames(
				'components-circular-option-picker',
				className
			) }
		>
			<CircularOptionPickerContext.Provider value={ compositeState }>
				{ Array.isArray( options ) ? (
					<OptionGroup options={ options } />
				) : (
					options
				) }
				{ children }
				{ actions && (
					<div className="components-circular-option-picker__custom-clear-wrapper">
						{ actions }
					</div>
				) }
			</CircularOptionPickerContext.Provider>
		</Composite>
	);
}

CircularOptionPicker.Option = Option;
CircularOptionPicker.OptionGroup = OptionGroup;
CircularOptionPicker.ButtonAction = ButtonAction;
CircularOptionPicker.DropdownLinkAction = DropdownLinkAction;

export default CircularOptionPicker;
