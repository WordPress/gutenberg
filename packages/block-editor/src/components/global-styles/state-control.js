/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { check, chevronDown } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

/**
 * State control for managing block state styles using grouped selection.
 * Each state group (e.g., "State", "Viewport") is rendered as a separate
 * radio group section. The user selects one value from each group, and
 * the combination determines which state styles are edited.
 *
 * @param {Object}   props             Component props.
 * @param {Array}    props.stateGroups Array of state groups, each with name, label, and states.
 * @param {Object}   props.value       Map of group name to selected state value.
 * @param {Function} props.onChange    Callback when selection changes.
 * @return {Element|null} State control component.
 */
export default function StateControl( {
	stateGroups = [],
	value = {},
	onChange,
} ) {
	if ( ! stateGroups || stateGroups.length === 0 ) {
		return null;
	}

	const getDropdownLabel = () => {
		const selectedLabels = stateGroups
			.filter( ( group ) => value[ group.name ] )
			.map( ( group ) => {
				const selectedState = group.states.find(
					( s ) => s.value === value[ group.name ]
				);
				return selectedState?.label;
			} )
			.filter( Boolean );

		if ( selectedLabels.length === 0 ) {
			return __( 'Default' );
		}
		return selectedLabels.join( ' + ' );
	};

	return (
		<DropdownMenu
			icon={ chevronDown }
			label={ sprintf(
				/* translators: %s: Current state combination (e.g. "Hover", "Mobile + Focus") */
				__( 'State: %s' ),
				getDropdownLabel()
			) }
			text={ getDropdownLabel() }
			popoverProps={ {
				placement: 'right-start',
			} }
			toggleProps={ {
				size: 'compact',
				variant: 'tertiary',
				iconPosition: 'right',
			} }
		>
			{ () => (
				<>
					{ stateGroups.map( ( group ) => (
						<MenuGroup key={ group.name } label={ group.label }>
							<MenuItem
								onClick={ () => {
									const newValue = { ...value };
									delete newValue[ group.name ];
									onChange( newValue );
								} }
								icon={ ! value[ group.name ] ? check : null }
							>
								{ __( 'Normal' ) }
							</MenuItem>
							{ group.states.map( ( state ) => (
								<MenuItem
									key={ state.value }
									onClick={ () => {
										onChange( {
											...value,
											[ group.name ]: state.value,
										} );
									} }
									icon={
										value[ group.name ] === state.value
											? check
											: null
									}
								>
									{ state.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) ) }
				</>
			) }
		</DropdownMenu>
	);
}
