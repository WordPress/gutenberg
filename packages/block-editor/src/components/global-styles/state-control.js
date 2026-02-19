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
 * @param {Object}   props                     Component props.
 * @param {Array}    props.states              Array of available states with value and label.
 * @param {string}   props.value               Currently selected state value.
 * @param {Function} props.onChange            Callback when selection changes.
 * @param {string}   [props.className]         Additional CSS class name.
 * @param {boolean}  [props.showDefaultOption] Whether to show the "Default" option. Default true.
 * @return {Element|null} State control component.
 */
export default function StateControl( {
	states = [],
	value = 'default',
	onChange,
	className,
	showDefaultOption = true,
} ) {
	// Don't render if there are no states
	if ( ! states || states.length === 0 ) {
		return null;
	}

	const stateOptions = showDefaultOption
		? [
				{ label: __( 'Default' ), value: 'default' },
				...states.map( ( state ) => ( {
					label: state.label,
					value: state.value,
				} ) ),
		  ]
		: states.map( ( state ) => ( {
				label: state.label,
				value: state.value,
		  } ) );

	const getCurrentStateLabel = () => {
		const currentOption = stateOptions.find(
			( option ) => option.value === value
		);
		return currentOption?.label || __( 'Default' );
	};

	return (
		<div className={ className }>
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
		</div>
	);
}

/**
 * Hook to determine if a block or element has available states.
 *
 * @param {string} name Block name or element name.
 * @return {Array} Array of available states, or empty array if none.
 */
export function useHasStates( name ) {
	// These constants mirror the ones in global-styles-ui/src/utils.ts
	// and lib/class-wp-theme-json-gutenberg.php
	const VALID_ELEMENT_STATES = {
		link: [
			{ value: ':link', label: __( 'Link' ) },
			{ value: ':any-link', label: __( 'Any Link' ) },
			{ value: ':visited', label: __( 'Visited' ) },
			{ value: ':hover', label: __( 'Hover' ) },
			{ value: ':focus', label: __( 'Focus' ) },
			{ value: ':focus-visible', label: __( 'Focus Visible' ) },
			{ value: ':active', label: __( 'Active' ) },
		],
		button: [
			{ value: ':link', label: __( 'Link' ) },
			{ value: ':any-link', label: __( 'Any Link' ) },
			{ value: ':visited', label: __( 'Visited' ) },
			{ value: ':hover', label: __( 'Hover' ) },
			{ value: ':focus', label: __( 'Focus' ) },
			{ value: ':focus-visible', label: __( 'Focus Visible' ) },
			{ value: ':active', label: __( 'Active' ) },
		],
	};

	const VALID_BLOCK_STATES = {
		'core/button': [
			{ value: ':hover', label: __( 'Hover' ) },
			{ value: ':focus', label: __( 'Focus' ) },
			{ value: ':focus-visible', label: __( 'Focus Visible' ) },
			{ value: ':active', label: __( 'Active' ) },
		],
	};

	// Check if it's a block
	if ( VALID_BLOCK_STATES[ name ] ) {
		return VALID_BLOCK_STATES[ name ];
	}

	// Check if it's an element
	if ( VALID_ELEMENT_STATES[ name ] ) {
		return VALID_ELEMENT_STATES[ name ];
	}

	return [];
}
