import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Infotip pattern; Popover is not allowlisted yet (same as widget-header-infotip).
import { Badge, Icon, Popover, Stack, VisuallyHidden } from '@wordpress/ui';

function getSummaryDescription( selectedViewport, selectedPseudoState ) {
	if ( selectedViewport && selectedPseudoState ) {
		return sprintf(
			/* translators: 1: viewport name, e.g. "Tablet". 2: pseudo state name, e.g. "Hover". */
			__(
				'Style changes apply to the %1$s viewport and the %2$s state.'
			),
			selectedViewport.label,
			selectedPseudoState.label
		);
	}

	if ( selectedViewport ) {
		return sprintf(
			/* translators: %s: viewport name, e.g. "Tablet". */
			__( 'Style changes apply to the %s viewport.' ),
			selectedViewport.label
		);
	}

	if ( selectedPseudoState ) {
		return sprintf(
			/* translators: %s: pseudo state name, e.g. "Hover". */
			__( 'Style changes apply to the %s state.' ),
			selectedPseudoState.label
		);
	}

	return '';
}

export default function StateControlBadges( {
	viewportStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	pseudoStateValue = 'default',
	className = 'block-editor-global-styles-state-control__badges',
} ) {
	const activeStates = [];
	const selectedViewport = viewportStates.find(
		( state ) => state.value === viewportValue
	);
	const selectedPseudoState = pseudoStates.find(
		( state ) => state.value === pseudoStateValue
	);

	if ( selectedViewport ) {
		activeStates.push( {
			key: `viewport-${ selectedViewport.value }`,
			label: selectedViewport.label,
		} );
	}

	if ( selectedPseudoState ) {
		activeStates.push( {
			key: `pseudo-${ selectedPseudoState.value }`,
			label: selectedPseudoState.label,
		} );
	}

	if ( ! activeStates.length ) {
		return null;
	}

	const summaryDescription = getSummaryDescription(
		selectedViewport,
		selectedPseudoState
	);
	const moreInfoLabel =
		activeStates.length === 1
			? sprintf(
					/* translators: %s: state name, e.g. "Hover" or "Tablet". */
					__( 'More information about %s' ),
					activeStates[ 0 ].label
				)
			: __( 'More information about style states' );

	return (
		<Stack
			className={ className }
			direction="row"
			justify="flex-start"
			align="center"
			gap="xs"
			wrap="wrap"
		>
			{ activeStates.map( ( state ) => (
				<Badge key={ state.key }>{ state.label }</Badge>
			) ) }
			<Popover.Root>
				<Popover.Trigger
					openOnHover
					delay={ 200 }
					closeDelay={ 200 }
					aria-label={ moreInfoLabel }
					className="block-editor-global-styles-state-control__badge-infotip"
				>
					<Icon icon={ info } size={ 20 } />
				</Popover.Trigger>
				<Popover.Popup className="block-editor-global-styles-state-control__badge-infotip-popup">
					<Popover.Arrow />
					<VisuallyHidden render={ <Popover.Title /> }>
						{ moreInfoLabel }
					</VisuallyHidden>
					<Popover.Description>
						{ summaryDescription }
					</Popover.Description>
				</Popover.Popup>
			</Popover.Root>
		</Stack>
	);
}
