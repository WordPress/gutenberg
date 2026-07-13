/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

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
			tooltipText: sprintf(
				/* translators: %s: viewport name, e.g. "Tablet". */
				__( 'Style changes apply only to the %s viewport.' ),
				selectedViewport.label
			),
		} );
	}

	if ( selectedPseudoState ) {
		activeStates.push( {
			key: `pseudo-${ selectedPseudoState.value }`,
			label: selectedPseudoState.label,
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
				const badge = (
					<WCBadge
						key={ state.key }
						className="block-editor-global-styles-state-control__badge"
						intent="info"
					>
						{ state.label }
					</WCBadge>
				);

				if ( ! state.tooltipText ) {
					return badge;
				}

				return (
					<Tooltip.Root key={ state.key }>
						<Tooltip.Trigger
							type="button"
							className="block-editor-global-styles-state-control__badge-tooltip-trigger"
						>
							{ badge }
						</Tooltip.Trigger>
						<Tooltip.Popup>{ state.tooltipText }</Tooltip.Popup>
					</Tooltip.Root>
				);
			} ) }
		</Stack>
	);
}
