/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { createContext, useContext, useEffect } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import { Composite, CompositeItem, useCompositeState } from '../composite';
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

const hasSelectedOption = new Map();

export function Option( {
	className,
	isSelected,
	selectedIconProps,
	tooltipText,
	...additionalProps
}: OptionProps ) {
	const compositeState = useContext( CircularOptionPickerContext );
	const {
		baseId = 'option',
		currentId,
		setCurrentId,
	} = compositeState as any;
	const id = useInstanceId( Option, baseId );

	useEffect( () => {
		// If we call `setCurrentId` here, it doesn't update for other
		// Option renders in the same pass. So we have to store our own
		// map to make sure that we only set the first selected option.
		// We still need to check `currentId` because the control will
		// update this as the user moves around, and that state should
		// be maintained as the group gains and loses focus.
		if ( isSelected && ! currentId && ! hasSelectedOption.get( baseId ) ) {
			hasSelectedOption.set( baseId, true );
			setCurrentId( id );
		}
	} );

	const optionControl = (
		<CompositeItem
			as={ Button }
			className={ classnames(
				'components-circular-option-picker__option',
				{
					'is-pressed': isSelected,
				}
			) }
			id={ id }
			{ ...additionalProps }
			{ ...compositeState }
			role="option"
			aria-selected={ !! isSelected }
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
	const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby } =
		additionalProps as any;
	const role = ariaLabel || ariaLabelledby ? 'group' : undefined;

	return (
		<div
			{ ...additionalProps }
			role={ role }
			className={ classnames(
				'components-circular-option-picker__option-group',
				'components-circular-option-picker__swatches',
				className
			) }
		>
			{ options }
		</div>
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
	const {
		actions,
		className,
		id: idProp,
		options,
		children,
		loop = true,
		...additionalProps
	} = props;
	const id = useInstanceId( CircularOptionPicker, 'option-picker', idProp );
	const rtl = isRTL();
	const compositeState = useCompositeState( { baseId: id, loop, rtl } );

	return (
		<Composite
			{ ...additionalProps }
			{ ...compositeState }
			role={ 'listbox' }
			className={ classnames(
				'components-circular-option-picker',
				className
			) }
		>
			<CircularOptionPickerContext.Provider value={ compositeState }>
				<div
					className={ 'components-circular-option-picker__swatches' }
				>
					{ options }
				</div>
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
