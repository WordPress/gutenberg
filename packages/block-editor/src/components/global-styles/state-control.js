/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { check, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

/**
 * State control for managing block state styles (hover, focus, current, etc.).
 *
 * Displays a dropdown that allows selecting one or more states. States are
 * split into two groups by their prefix:
 *   - Pseudo-selector states (`:hover`, `:focus`, `:active`, …)
 *   - Custom class-based states (`@current`, …)
 *
 * Multiple states may be selected simultaneously to style compound states,
 * e.g. `@current` + `:hover` produces styles for `.current-menu-item:hover`.
 * Custom states are always stored before pseudo-selector states in the value
 * array since they represent the outer nesting level in the style object.
 *
 * @param {Object}   props          Component props.
 * @param {Array}    props.states   Array of available states `{ value, label }`.
 * @param {string[]} props.value    Currently selected state values.
 * @param {Function} props.onChange Callback receiving the updated `string[]`.
 * @param {boolean}  props.showText Whether to show a text label on the toggle.
 * @return {Element|null} State control component, or null if no states.
 */
export default function StateControl( {
	states = [],
	value = [],
	onChange,
	showText = true,
} ) {
	if ( ! states || states.length === 0 ) {
		return null;
	}

	const pseudoStates = states.filter( ( s ) => ! s.value.startsWith( '@' ) );
	const customStates = states.filter( ( s ) => s.value.startsWith( '@' ) );

	const selectedPseudo = value.filter( ( v ) => ! v.startsWith( '@' ) );
	const selectedCustom = value.filter( ( v ) => v.startsWith( '@' ) );

	/*
	 * Toggle a state in or out of the selection. Custom states are always
	 * placed before pseudo-selector states in the array so that path
	 * traversal (e.g. style['@current'][':hover']) is consistent.
	 */
	function toggleState( stateValue ) {
		const isAlreadySelected = value.includes( stateValue );
		if ( isAlreadySelected ) {
			onChange( value.filter( ( v ) => v !== stateValue ) );
			return;
		}
		const isCustom = stateValue.startsWith( '@' );
		if ( isCustom ) {
			onChange( [ stateValue, ...selectedPseudo ] );
		} else {
			onChange( [ ...selectedCustom, stateValue ] );
		}
	}

	function getCurrentLabel() {
		if ( value.length === 0 ) {
			return __( 'Default' );
		}
		const customLabel =
			selectedCustom.length > 0
				? states.find( ( s ) => s.value === selectedCustom[ 0 ] )?.label
				: null;
		const pseudoLabel =
			selectedPseudo.length > 0
				? states.find( ( s ) => s.value === selectedPseudo[ 0 ] )?.label
				: null;

		if ( customLabel && pseudoLabel ) {
			return sprintf(
				/* translators: 1: item state label (e.g. "Current"), 2: interaction label (e.g. "Hover") */
				__( '%1$s: %2$s' ),
				customLabel,
				pseudoLabel
			);
		}
		return customLabel || pseudoLabel || __( 'Default' );
	}

	const label = getCurrentLabel();
	const icon = showText ? chevronDown : moreVertical;
	const toggleProps = showText
		? { size: 'compact', variant: 'tertiary', iconPosition: 'right' }
		: { size: 'compact', variant: 'tertiary' };

	return (
		<DropdownMenu
			icon={ icon }
			label={ sprintf(
				/* translators: %s: current state label (e.g. "Hover", "Current: Focus") */
				__( 'State: %s' ),
				label
			) }
			text={ showText ? label : undefined }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								onChange( [] );
								onClose();
							} }
							icon={ value.length === 0 ? check : null }
						>
							{ __( 'Default' ) }
						</MenuItem>
					</MenuGroup>
					{ pseudoStates.length > 0 && (
						<MenuGroup label={ __( 'States' ) }>
							{ pseudoStates.map( ( option ) => (
								<MenuItem
									key={ option.value }
									onClick={ () =>
										toggleState( option.value )
									}
									icon={
										value.includes( option.value )
											? check
											: null
									}
								>
									{ option.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
					{ customStates.length > 0 && (
						<MenuGroup label={ __( 'Item' ) }>
							{ customStates.map( ( option ) => (
								<MenuItem
									key={ option.value }
									onClick={ () =>
										toggleState( option.value )
									}
									icon={
										value.includes( option.value )
											? check
											: null
									}
								>
									{ option.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
}
