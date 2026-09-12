import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import {
	Badge,
	Icon,
	Popover,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';

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
			description: sprintf(
				/* translators: %s: viewport name, e.g. "Tablet". */
				__( 'Style changes apply to the %s viewport.' ),
				selectedViewport.label
			),
		} );
	}

	if ( selectedPseudoState ) {
		activeStates.push( {
			key: `pseudo-${ selectedPseudoState.value }`,
			label: selectedPseudoState.label,
			description: sprintf(
				/* translators: %s: pseudo state name, e.g. "Hover". */
				__( 'Style changes apply to the %s state.' ),
				selectedPseudoState.label
			),
		} );
	}

	return (
		<Stack
			className={ className }
			direction="row"
			justify="flex-start"
			gap="xs"
			wrap="wrap"
		>
			{ activeStates.map( ( state ) => {
				const moreInfoLabel = sprintf(
					/* translators: %s: state name, e.g. "Hover" or "Tablet". */
					__( 'More information about %s' ),
					state.label
				);

				return (
					<Stack
						key={ state.key }
						className="block-editor-global-styles-state-control__badge-item"
						direction="row"
						align="center"
						gap="xs"
					>
						<Badge
							className="block-editor-global-styles-state-control__badge"
							intent="informational"
						>
							{ state.label }
						</Badge>
						<Popover.Root>
							<Popover.Trigger
								openOnHover
								delay={ 200 }
								closeDelay={ 200 }
								aria-label={ moreInfoLabel }
								className="block-editor-global-styles-state-control__badge-infotip"
							>
								<Icon icon={ info } size={ 16 } />
							</Popover.Trigger>
							<Popover.Popup className="block-editor-global-styles-state-control__badge-infotip-popup">
								<Popover.Arrow />
								<VisuallyHidden render={ <Popover.Title /> }>
									{ moreInfoLabel }
								</VisuallyHidden>
								<Popover.Description>
									{ state.description }
								</Popover.Description>
							</Popover.Popup>
						</Popover.Root>
					</Stack>
				);
			} ) }
		</Stack>
	);
}
