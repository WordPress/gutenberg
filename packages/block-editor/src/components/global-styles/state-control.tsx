import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, moreVertical } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
} from '@wordpress/ui';
import type { ComponentProps } from 'react';
import type { StateControlProps } from './types';

type PositionerSide = ComponentProps< typeof Menu.Positioner >[ 'side' ];
type PositionerAlign = ComponentProps< typeof Menu.Positioner >[ 'align' ];

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
	popoverProps,
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
			info: state.info,
		} ) ),
	];
	const pseudoStateOptions = [
		{
			label: __( 'Default' ),
			value: 'default',
			info: __( 'Applies when no other state is active.' ),
		},
		...pseudoStates.map( ( state ) => ( {
			label: state.label,
			value: state.value,
			info: state.info,
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

	const shouldCloseViewportOnClick = ! hasPseudoStateOptions && ! children;
	const shouldClosePseudoOnClick = ! hasViewportOptions && ! children;

	let side: PositionerSide = 'bottom';
	let align: PositionerAlign = 'end';

	if ( popoverProps?.placement ) {
		const [ placementSide, placementAlign ] = popoverProps.placement.split(
			'-'
		) as [ PositionerSide | undefined, PositionerAlign | undefined ];
		if ( placementSide ) {
			side = placementSide;
		}
		align =
			placementAlign ??
			( placementSide === 'bottom' || placementSide === 'top'
				? 'end'
				: 'start' );
	}

	const sideOffset =
		typeof popoverProps?.offset === 'number'
			? popoverProps.offset
			: popoverProps?.offset?.mainAxis;

	return (
		<Stack
			direction="column"
			gap="sm"
			align="flex-end"
			className="block-editor-global-styles-state-control"
		>
			<Menu.Root modal={ false }>
				<Menu.Trigger
					render={
						showText ? (
							<Button
								size="compact"
								icon={ chevronDown }
								iconPosition="right"
							>
								{ triggerLabel }
							</Button>
						) : (
							<Button
								size="small"
								icon={ moreVertical }
								label={ sprintf(
									/* translators: %s: Current state (e.g. "Hover", "Focus") */
									__( 'State: %s' ),
									currentStateLabel
								) }
							/>
						)
					}
				/>
				<Menu.Popup
					positioner={
						<Menu.Positioner
							side={ side }
							align={ align }
							sideOffset={ sideOffset }
						/>
					}
				>
					{ hasViewportOptions && (
						<Menu.RadioGroup
							value={ viewportValue }
							onValueChange={ ( value ) =>
								onChangeViewport?.( value as string )
							}
						>
							<Menu.GroupLabel>
								{ __( 'Viewport' ) }
							</Menu.GroupLabel>
							{ viewportOptions.map( ( option ) => (
								<Menu.RadioItem
									key={ `viewport-${ option.value }` }
									value={ option.value }
									closeOnClick={ shouldCloseViewportOnClick }
								>
									<Menu.ItemLabel>
										{ option.label }
									</Menu.ItemLabel>
									{ option.info ? (
										<Menu.ItemDescription>
											{ option.info }
										</Menu.ItemDescription>
									) : null }
								</Menu.RadioItem>
							) ) }
						</Menu.RadioGroup>
					) }
					{ hasViewportOptions && hasPseudoStateOptions && (
						<Menu.Separator />
					) }
					{ hasPseudoStateOptions && (
						<Menu.RadioGroup
							value={ pseudoStateValue }
							onValueChange={ ( value ) =>
								onChangePseudoState?.( value as string )
							}
						>
							<Menu.GroupLabel>
								{ __( 'Pseudo state' ) }
							</Menu.GroupLabel>
							{ pseudoStateOptions.map( ( option ) => (
								<Menu.RadioItem
									key={ `pseudo-${ option.value }` }
									value={ option.value }
									closeOnClick={ shouldClosePseudoOnClick }
								>
									<Menu.ItemLabel>
										{ option.label }
									</Menu.ItemLabel>
									{ option.info ? (
										<Menu.ItemDescription>
											{ option.info }
										</Menu.ItemDescription>
									) : null }
								</Menu.RadioItem>
							) ) }
						</Menu.RadioGroup>
					) }
					{ children && (
						<>
							{ ( hasViewportOptions ||
								hasPseudoStateOptions ) && <Menu.Separator /> }
							{ children }
						</>
					) }
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);
}
