// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Dropdown from '../dropdown';
import Tooltip from '../tooltip';

function Option( props ) {
	const {
		className,
		isSelected,
		selectedIconProps,
		tooltipText,
		...additionalProps
	} = props;
	const optionButton = (
		<Button
			isPressed={ isSelected }
			className="components-circular-option-picker__option"
			{ ...additionalProps }
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
				<Tooltip text={ tooltipText }>{ optionButton }</Tooltip>
			) : (
				optionButton
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

function DropdownLinkAction( props ) {
	const { buttonProps, className, dropdownProps, linkText } = props;
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

function ButtonAction( props ) {
	const { className, children, ...additionalProps } = props;
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

export default function CircularOptionPicker( props ) {
	const { actions, className, options, children } = props;
	return (
		<div
			className={ classnames(
				'components-circular-option-picker',
				className
			) }
		>
			<div className="components-circular-option-picker__swatches">
				{ options }
			</div>
			{ children }
			{ actions && (
				<div className="components-circular-option-picker__custom-clear-wrapper">
					{ actions }
				</div>
			) }
		</div>
	);
}

CircularOptionPicker.Option = Option;
CircularOptionPicker.ButtonAction = ButtonAction;
CircularOptionPicker.DropdownLinkAction = DropdownLinkAction;
