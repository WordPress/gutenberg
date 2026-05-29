/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { check, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

function buildOptions( states ) {
	return [
		{ label: __( 'Default' ), value: 'default' },
		...states.map( ( state ) => ( {
			label: state.label,
			value: state.value,
		} ) ),
	];
}

/**
 * State control for managing viewport, custom (class-based), and pseudo-state styles.
 * Displays a dropdown menu with separate groups for each selector.
 *
 * @param {Object}   props                     Component props.
 * @param {Array}    props.viewportStates      Array of available viewport states.
 * @param {Array}    props.customStates        Array of available custom (class-based) states (e.g. `@current`).
 * @param {Array}    props.pseudoStates        Array of available pseudo states.
 * @param {string}   props.viewportValue       Currently selected viewport value.
 * @param {string}   props.customStateValue    Currently selected custom state value.
 * @param {string}   props.pseudoStateValue    Currently selected pseudo state value.
 * @param {Function} props.onChangeViewport    Callback when viewport selection changes.
 * @param {Function} props.onChangeCustomState Callback when custom state selection changes.
 * @param {Function} props.onChangePseudoState Callback when pseudo state selection changes.
 * @param {boolean}  props.showText            Whether to show text label on the toggle. Default true.
 * @param {Object}   props.popoverProps        Popover props for the dropdown menu.
 * @return {Element|null} State control component.
 */
export default function StateControl( {
	viewportStates = [],
	customStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	customStateValue = 'default',
	pseudoStateValue = 'default',
	onChangeViewport,
	onChangeCustomState,
	onChangePseudoState,
	showText = true,
	popoverProps = {},
} ) {
	const viewportOptions = useMemo(
		() => buildOptions( viewportStates ),
		[ viewportStates ]
	);
	const customStateOptions = useMemo(
		() => buildOptions( customStates ),
		[ customStates ]
	);
	const pseudoStateOptions = useMemo(
		() => buildOptions( pseudoStates ),
		[ pseudoStates ]
	);

	if (
		! viewportStates.length &&
		! customStates.length &&
		! pseudoStates.length
	) {
		return null;
	}

	const hasViewportOptions = viewportStates.length > 0;
	const hasCustomStateOptions = customStates.length > 0;
	const hasPseudoStateOptions = pseudoStates.length > 0;
	const triggerLabel = __( 'States' );
	const activeStates = [];

	if ( hasViewportOptions && viewportValue !== 'default' ) {
		const selectedViewport = viewportOptions.find(
			( option ) => option.value === viewportValue
		);

		if ( selectedViewport ) {
			activeStates.push( {
				key: `viewport-${ selectedViewport.value }`,
				label: selectedViewport.label,
			} );
		}
	}

	if ( hasCustomStateOptions && customStateValue !== 'default' ) {
		const selectedCustomState = customStateOptions.find(
			( option ) => option.value === customStateValue
		);

		if ( selectedCustomState ) {
			activeStates.push( {
				key: `custom-${ selectedCustomState.value }`,
				label: selectedCustomState.label,
			} );
		}
	}

	if ( hasPseudoStateOptions && pseudoStateValue !== 'default' ) {
		const selectedPseudoState = pseudoStateOptions.find(
			( option ) => option.value === pseudoStateValue
		);

		if ( selectedPseudoState ) {
			activeStates.push( {
				key: `pseudo-${ selectedPseudoState.value }`,
				label: selectedPseudoState.label,
			} );
		}
	}

	const currentStateLabel = activeStates.length
		? activeStates.map( ( state ) => state.label ).join( ', ' )
		: __( 'Default' );
	const icon = showText ? chevronDown : moreVertical;
	const toggleProps = showText
		? { size: 'compact', variant: 'tertiary', iconPosition: 'right' }
		: { size: 'compact', variant: 'tertiary' };

	return (
		<Stack
			direction="column"
			gap="sm"
			align="flex-end"
			className="block-editor-global-styles-state-control"
		>
			<DropdownMenu
				icon={ icon }
				label={
					showText
						? triggerLabel
						: sprintf(
								/* translators: %s: Current state (e.g. "Hover", "Focus") */
								__( 'State: %s' ),
								currentStateLabel
						  )
				}
				popoverProps={ {
					placement: 'right-start',
					...popoverProps,
				} }
				text={ showText ? triggerLabel : undefined }
				toggleProps={ toggleProps }
			>
				{ ( { onClose } ) => {
					const hasMultipleGroups =
						[
							hasViewportOptions,
							hasCustomStateOptions,
							hasPseudoStateOptions,
						].filter( Boolean ).length > 1;
					return (
						<>
							{ hasViewportOptions && (
								<MenuGroup label={ __( 'Viewport' ) }>
									{ viewportOptions.map( ( option ) => (
										<MenuItem
											key={ `viewport-${ option.value }` }
											onClick={ () => {
												onChangeViewport?.(
													option.value
												);
												if ( ! hasMultipleGroups ) {
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
							{ hasCustomStateOptions && (
								<MenuGroup
									label={ _x(
										'Item',
										'block style state group for per-item states'
									) }
								>
									{ customStateOptions.map( ( option ) => (
										<MenuItem
											key={ `custom-${ option.value }` }
											onClick={ () => {
												onChangeCustomState?.(
													option.value
												);
												if ( ! hasMultipleGroups ) {
													onClose();
												}
											} }
											icon={
												customStateValue ===
												option.value
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
												onChangePseudoState?.(
													option.value
												);
												if ( ! hasMultipleGroups ) {
													onClose();
												}
											} }
											icon={
												pseudoStateValue ===
												option.value
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
					);
				} }
			</DropdownMenu>
		</Stack>
	);
}
