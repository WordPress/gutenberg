/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
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
	onClearViewport,
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
		const tooltipText = sprintf(
			/* translators: %s: viewport name, e.g. "Tablet". */
			__( 'Style changes apply only to the %s viewport.' ),
			selectedViewport.label
		);

		activeStates.push( {
			key: `viewport-${ selectedViewport.value }`,
			label: selectedViewport.label,
			tooltipText,
			onClear: onClearViewport,
			clearLabel: sprintf(
				/* translators: %s: viewport name, e.g. "Tablet". */
				__( 'Stop editing %s viewport' ),
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
						className={
							state.onClear
								? 'block-editor-global-styles-state-control__badge has-action'
								: 'block-editor-global-styles-state-control__badge'
						}
						intent="info"
					>
						<span className="block-editor-global-styles-state-control__badge-content">
							{ state.label }
							{ state.onClear && (
								<Button
									className="block-editor-global-styles-state-control__badge-dismiss"
									icon={ closeSmall }
									iconSize={ 20 }
									label={ state.clearLabel }
									onClick={ state.onClear }
									showTooltip={ false }
									size="small"
								/>
							) }
						</span>
					</WCBadge>
				);

				if ( ! state.tooltipText ) {
					return badge;
				}

				return (
					<Tooltip.Root key={ state.key }>
						<Tooltip.Trigger
							render={
								<span className="block-editor-global-styles-state-control__badge-tooltip-trigger">
									{ badge }
								</span>
							}
						/>
						<Tooltip.Popup>{ state.tooltipText }</Tooltip.Popup>
					</Tooltip.Root>
				);
			} ) }
		</Stack>
	);
}
