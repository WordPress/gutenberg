import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, moreVertical } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
} from '@wordpress/ui';
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
	const [ side, align = 'center' ] = (
		popoverProps.placement ?? 'right-start'
	).split( '-' ) as [
		ComponentProps< typeof Menu.Positioner >[ 'side' ],
		ComponentProps< typeof Menu.Positioner >[ 'align' ],
	];
	const offset = popoverProps.offset ?? 0;

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
						<Button
							size={ showText ? 'compact' : 'small' }
							icon={ showText ? chevronDown : moreVertical }
							iconPosition="right"
							label={
								showText
									? triggerLabel
									: sprintf(
											/* translators: %s: Current state (e.g. "Hover", "Focus") */
											__( 'State: %s' ),
											currentStateLabel
										)
							}
							showTooltip
						>
							{ showText ? triggerLabel : undefined }
						</Button>
					}
				/>
				<Menu.Popup
					positioner={
						<Menu.Positioner
							side={ side }
							align={ align }
							sideOffset={
								typeof offset === 'number'
									? offset
									: offset.mainAxis
							}
							alignOffset={
								typeof offset === 'number'
									? 0
									: ( { align: popupAlign } ) =>
											( offset.crossAxis ?? 0 ) *
											( popupAlign === 'end' ? -1 : 1 )
							}
							collisionAvoidance={ {
								side: 'flip',
								align: popoverProps.shift ? 'shift' : 'flip',
							} }
						/>
					}
				>
					{ hasViewportOptions && (
						<Menu.RadioGroup
							value={ viewportValue }
							onValueChange={ ( value ) =>
								onChangeViewport?.( value )
							}
						>
							<Menu.GroupLabel>
								{ __( 'Viewport' ) }
							</Menu.GroupLabel>
							{ viewportOptions.map( ( option ) => (
								<Menu.RadioItem
									key={ `viewport-${ option.value }` }
									value={ option.value }
									closeOnClick={
										! hasPseudoStateOptions && ! children
									}
								>
									<Menu.ItemLabel>
										{ option.label }
									</Menu.ItemLabel>
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
								onChangePseudoState?.( value )
							}
						>
							<Menu.GroupLabel>
								{ __( 'Pseudo state' ) }
							</Menu.GroupLabel>
							{ pseudoStateOptions.map( ( option ) => (
								<Menu.RadioItem
									key={ `pseudo-${ option.value }` }
									value={ option.value }
									closeOnClick={
										! hasViewportOptions && ! children
									}
								>
									<Menu.ItemLabel>
										{ option.label }
									</Menu.ItemLabel>
								</Menu.RadioItem>
							) ) }
						</Menu.RadioGroup>
					) }
					{ children && <Menu.Separator /> }
					{ children }
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);
}
