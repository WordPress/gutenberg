/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

export default function StateControlBadges( {
	viewportStates = [],
	customStates = [],
	pseudoStates = [],
	viewportValue = 'default',
	customStateValue = 'default',
	pseudoStateValue = 'default',
	className = 'block-editor-global-styles-state-control__badges',
} ) {
	const activeStates = [];
	const selectedViewport = viewportStates.find(
		( state ) => state.value === viewportValue
	);
	const selectedCustomState = customStates.find(
		( state ) => state.value === customStateValue
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

	if ( selectedCustomState ) {
		activeStates.push( {
			key: `custom-${ selectedCustomState.value }`,
			label: selectedCustomState.label,
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
			{ activeStates.map( ( state ) => (
				<WCBadge key={ state.key } intent="info">
					{ state.label }
				</WCBadge>
			) ) }
		</Stack>
	);
}
