import { __, sprintf } from '@wordpress/i18n';
import { check, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import type { ComponentProps } from 'react';
import type { StateControlProps } from './types';

/**
 * State control for managing viewport and pseudo-state styles.
 * Displays a dropdown menu with separate groups for each selector.
 *
 * @param props                     Component props.
 * @param props.viewportStates      Array of available viewport states.
 * @param props.pseudoStates        Array of available pseudo states.
 * @param props.viewportValue       Currently selected viewport value.
 * @param props.pseudoStateValue    Currently selected pseudo state value.
 * @param props.onChangeViewport    Callback when viewport selection changes.
 * @param props.onChangePseudoState Callback when pseudo state selection changes.
 * @param props.showText            Whether to show text label on the toggle. Default true.
 * @param props.popoverProps        Popover props for the dropdown menu.
 * @param props.children            Optional menu content rendered after the state groups.
 * @return State control component.
 */
export default function StateControl( {
	viewportStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	pseudoStateValue = 'default',
	onChangeViewport,
	onChangePseudoState,
	showText = true,
	popoverProps = {},
	children,
}: StateControlProps ) {
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
	const triggerLabel = __( 'States' );
	const activeStates: { key: string; label: string }[] = [];

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
	const toggleProps: ComponentProps< typeof DropdownMenu >[ 'toggleProps' ] =
		showText
			? { size: 'compact', iconPosition: 'right' }
			: { size: 'small' };

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
				{ ( { onClose } ) => (
					<>
						{ hasViewportOptions && (
							<MenuGroup label={ __( 'Viewport' ) }>
								{ viewportOptions.map( ( option ) => (
									<MenuItem
										key={ `viewport-${ option.value }` }
										onClick={ () => {
											onChangeViewport?.( option.value );
											if (
												! hasPseudoStateOptions &&
												! children
											) {
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
											onChangePseudoState?.(
												option.value
											);
											if (
												! hasViewportOptions &&
												! children
											) {
												onClose();
											}
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
						{ children }
					</>
				) }
			</DropdownMenu>
		</Stack>
	);
}
