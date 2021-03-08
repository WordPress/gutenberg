/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { buttonOutside, buttonInside, noButton } from './icons';

const BUTTON_OPTIONS = [
	'button-inside',
	'button-outside',
	'no-button',
	'button-only',
];

/**
 * Creates a custom dropdown menu for the button position options.
 *
 * @param {Object} Component 				Component properties.
 * @param {string} Component.selectedOption	The selected option.
 * @param {Function} Component.onChange 	Function to handle a change
 * 											in the selected option.
 *
 * @return {DropdownMenu} Dropdown menu for use inside {ToolbarGroup}
 */
export default function ButtonPositionDropdown( { selectedOption, onChange } ) {
	const getButtonIcon = ( option ) => {
		switch ( option ) {
			case 'button-inside':
				return buttonInside;
			case 'button-outside':
				return buttonOutside;
			case 'no-button':
				return noButton;
		}
	};

	const getButtonTitle = ( option ) => {
		switch ( option ) {
			case 'button-inside':
				return __( 'Button Inside' );
			case 'button-outside':
				return __( 'Button Outside' );
			case 'no-button':
				return __( 'No Button' );
		}
	};

	const createOptionControl = (
		targetOption,
		activeOption,
		title,
		onChangeCallback
	) => {
		const isActive = targetOption === activeOption;

		return {
			icon: getButtonIcon( targetOption ),
			title,
			isActive,
			onClick: () => onChangeCallback( targetOption ),
		};
	};

	return (
		<DropdownMenu
			icon={ getButtonIcon( selectedOption ) }
			controls={ BUTTON_OPTIONS.map( ( option ) =>
				createOptionControl(
					option,
					selectedOption,
					getButtonTitle( option ),
					onChange
				)
			) }
			label={ __( 'Change button position' ) }
		/>
	);
}
