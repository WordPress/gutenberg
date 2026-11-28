import { __, sprintf } from '@wordpress/i18n';
import {
	Badge,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Infotip pattern; Popover is not allowlisted yet (same as widget-header-infotip).
	Popover,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';
import type { StateControlBadgesProps } from './types';

export default function StateControlBadges( {
	viewportStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	pseudoStateValue = 'default',
	className = 'block-editor-global-styles-state-control__badges',
}: StateControlBadgesProps ) {
	const activeStates: {
		key: string;
		label: string;
		description: string;
	}[] = [];
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

	if ( ! activeStates.length ) {
		return null;
	}

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
				<Badge
					key={ state.key }
					infotip={ {
						popover: Popover,
						popup: (
							<Popover.Popup className="block-editor-global-styles-state-control__badge-infotip-popup">
								<VisuallyHidden render={ <Popover.Title /> }>
									{ state.label }
								</VisuallyHidden>
								<Popover.Description>
									{ state.description }
								</Popover.Description>
							</Popover.Popup>
						),
					} }
				>
					{ state.label }
				</Badge>
			) ) }
		</Stack>
	);
}
