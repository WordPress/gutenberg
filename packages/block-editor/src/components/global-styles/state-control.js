/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { check, chevronDown } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

/**
 * State control for managing viewport and pseudo-state styles.
 * Displays a dropdown menu with separate groups for each selector.
 *
 * @param {Object}   props                     Component props.
 * @param {Array}    props.viewportStates      Array of available viewport states.
 * @param {Array}    props.pseudoStates        Array of available pseudo states.
 * @param {string}   props.viewportValue       Currently selected viewport value.
 * @param {string}   props.pseudoStateValue    Currently selected pseudo state value.
 * @param {Function} props.onChangeViewport    Callback when viewport selection changes.
 * @param {Function} props.onChangePseudoState Callback when pseudo state selection changes.
 * @return {Element|null} State control component.
 */
export default function StateControl( {
	viewportStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	pseudoStateValue = 'default',
	onChangeViewport,
	onChangePseudoState,
} ) {
	if ( ! viewportStates.length && ! pseudoStates.length ) {
		return null;
	}

	const viewportOptions = [
		{ label: __( 'Default' ), value: 'default' },
		...viewportStates.map( ( state ) => ( {
			label: state.label,
			value: state.value,
		} ) ),
	];
	const pseudoStateOptions = [
		{ label: __( 'Default' ), value: 'default' },
		...pseudoStates.map( ( state ) => ( {
			label: state.label,
			value: state.value,
		} ) ),
	];

	const hasViewportOptions = viewportStates.length > 0;
	const hasPseudoStateOptions = pseudoStates.length > 0;
	const triggerLabel = __( 'Properties' );

	return (
		<DropdownMenu
			icon={ chevronDown }
			label={ triggerLabel }
			text={ triggerLabel }
			toggleProps={ {
				size: 'compact',
				variant: 'tertiary',
				iconPosition: 'right',
			} }
		>
			{ ( { onClose } ) => (
				<>
					{ hasViewportOptions && (
						<MenuGroup label={ __( 'Viewport' ) }>
							{ viewportOptions.map( ( option ) => (
								<MenuItem
									key={ `viewport-${ option.value }` }
									onClick={ () => {
										onChangeViewport?.( option.value );
										if ( ! hasPseudoStateOptions ) {
											onClose();
										}
									} }
									icon={
										viewportValue === option.value
											? check
											: null
									}
								>
									{ option.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
					{ hasPseudoStateOptions && (
						<MenuGroup label={ __( 'Pseudo state' ) }>
							{ pseudoStateOptions.map( ( option ) => (
								<MenuItem
									key={ `pseudo-${ option.value }` }
									onClick={ () => {
										onChangePseudoState?.( option.value );
										onClose();
									} }
									icon={
										pseudoStateValue === option.value
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
