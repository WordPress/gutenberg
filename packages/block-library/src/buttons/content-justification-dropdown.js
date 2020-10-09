/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	contentJustificationCenterIcon,
	contentJustificationLeftIcon,
	contentJustificationRightIcon,
} from './icons';

const DEFAULT_ALLOWED_VALUES = [ 'left', 'center', 'right' ];

const CONTROLS = {
	left: {
		icon: contentJustificationLeftIcon,
		title: __( 'Justify items left' ),
	},
	center: {
		icon: contentJustificationCenterIcon,
		title: __( 'Justify items center' ),
	},
	right: {
		icon: contentJustificationRightIcon,
		title: __( 'Justify items right' ),
	},
};

const DEFAULT_ICON = CONTROLS.center.icon;

/**
 * Dropdown for selecting a content justification option.
 *
 * @param {Object}   props                 Component props.
 * @param {string[]} [props.allowedValues] List of options to include. Default:
 *                                         ['left', 'center', 'right'].
 * @param {()=>void} props.onChange        Callback to run when an option is
 *                                         selected in the dropdown.
 * @param {Object}   props.toggleProps     Props to pass to the dropdown toggle.
 * @param {string}   props.value           The current content justification
 *                                         value.
 *
 * @return {WPComponent} The component.
 */
export default function ContentJustificationDropdown( {
	onChange,
	allowedValues = DEFAULT_ALLOWED_VALUES,
	toggleProps,
	value,
} ) {
	return (
		<DropdownMenu
			icon={ CONTROLS[ value ]?.icon ?? DEFAULT_ICON }
			label={ __( 'Change content justification' ) }
			controls={ allowedValues.map( ( allowedValue ) => {
				return {
					...CONTROLS[ allowedValue ],
					isActive: value === allowedValue,
					role: 'menuitemradio',
					onClick: () =>
						onChange(
							value === allowedValue ? undefined : allowedValue
						),
				};
			} ) }
			toggleProps={ toggleProps }
		/>
	);
}
