/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { check, chevronDown } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

/**
 * State control for managing block state styles (hover, focus, etc.).
 * Displays a dropdown menu to select between different states.
 *
 * @param {Object}   props          Component props.
 * @param {Array}    props.states   Array of available states with value and label.
 * @param {string}   props.value    Currently selected state value.
 * @param {Function} props.onChange Callback when selection changes.
 * @return {Element|null} State control component.
 */
export default function StateControl( {
	states = [],
	value = 'default',
	onChange,
} ) {
	if ( ! states || states.length === 0 ) {
		return null;
	}

	const stateOptions = [
		{ label: __( 'Default' ), value: 'default' },
		...states.map( ( state ) => ( {
			label: state.label,
			value: state.value,
		} ) ),
	];

	const getCurrentStateLabel = () => {
		const currentOption = stateOptions.find(
			( option ) => option.value === value
		);
		return currentOption?.label || __( 'Default' );
	};

	return (
		<DropdownMenu
			icon={ chevronDown }
			label={ sprintf(
				/* translators: %s: Current state (e.g. "Hover", "Focus") */
				__( 'State: %s' ),
				getCurrentStateLabel()
			) }
			text={ getCurrentStateLabel() }
			toggleProps={ {
				size: 'compact',
				variant: 'tertiary',
				iconPosition: 'right',
			} }
		>
			{ ( { onClose } ) => (
				<MenuGroup label={ __( 'State' ) }>
					{ stateOptions.map( ( option ) => (
						<MenuItem
							key={ option.value }
							onClick={ () => {
								onChange( option.value );
								onClose();
							} }
							icon={ value === option.value ? check : null }
						>
							{ option.label }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
