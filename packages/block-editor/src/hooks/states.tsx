import { useMemo } from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { __, _x } from '@wordpress/i18n';
import StateControl from '../components/global-styles/state-control';
import StateControlBadges from '../components/global-styles/state-control-badges';
import { useToolsPanelDropdownMenuProps } from '../components/global-styles/utils';
import { useSettings } from '../components/use-settings';
import { unlock } from '../lock-unlock';
import type { StyleStateOption } from '../components/global-styles/types';
import type { BlockStatesControlProps, BlockStateBadgesProps } from './types';

const { getViewportBreakpoints } = unlock( globalStylesEnginePrivateApis );

export const PSEUDO_STATE_LABELS: Record< string, string > = {
	':hover': _x( 'Hover', 'Name for the CSS pseudo-class selector' ),
	':focus': _x( 'Focus', 'Name for the CSS pseudo-class selector' ),
	':focus-visible': _x(
		'Focus-visible',
		'Name for the CSS pseudo-class selector'
	),
	':active': _x( 'Active', 'Name for the CSS pseudo-class selector' ),
};

export const RESPONSIVE_STATE_LABELS = {
	'@tablet': __( 'Tablet' ),
	'@mobile': __( 'Mobile' ),
};

// Viewport states are selected globally via the editor's device preview.
function getDeviceStateOptions(
	viewportSettings: unknown
): StyleStateOption[] {
	const breakpoints = getViewportBreakpoints( viewportSettings );

	return Object.entries( RESPONSIVE_STATE_LABELS )
		.filter(
			( [ value ] ) =>
				( value !== '@tablet' || breakpoints.tablet !== undefined ) &&
				( value !== '@mobile' || breakpoints.mobile !== undefined )
		)
		.map( ( [ value, label ] ) => ( {
			value,
			label,
		} ) );
}

// Keep in sync with WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS
// and packages/global-styles-engine/src/core/render.tsx.
export const VALID_BLOCK_PSEUDO_STATES: Record< string, string[] > = {
	'core/button': [ ':hover', ':focus', ':focus-visible', ':active' ],
	'core/navigation-link': [ ':hover', ':focus', ':focus-visible', ':active' ],
};

function getPseudoStateOptions( name: string ): StyleStateOption[] {
	const validStates = VALID_BLOCK_PSEUDO_STATES[ name ] ?? [];

	return validStates
		.filter( ( state ) => PSEUDO_STATE_LABELS[ state ] )
		.map( ( state ) => ( {
			value: state,
			label: PSEUDO_STATE_LABELS[ state ],
		} ) );
}

const DEFAULT_STATE_VALUE = 'default';
const EMPTY_STATE_OPTIONS: StyleStateOption[] = [];

/**
 * Renders a pseudo-state selector in the block card header.
 *
 * Viewport states are selected globally via the editor's device preview
 * (Responsive editing), so only pseudo-states are exposed here.
 *
 * @param props          Component props.
 * @param props.name     Block name.
 * @param props.value    Currently selected style-state value.
 * @param props.onChange Callback when style-state selection changes.
 * @param props.children Optional menu content rendered after the
 *                       state groups.
 * @return State control component, or null if not applicable.
 */
export function BlockStatesControl( {
	name,
	value,
	onChange,
	children,
}: BlockStatesControlProps ) {
	const pseudoStateOptions = useMemo(
		() => getPseudoStateOptions( name ),
		[ name ]
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	if ( ! pseudoStateOptions.length ) {
		return null;
	}

	return (
		<StateControl
			pseudoStates={ pseudoStateOptions }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
			onChangePseudoState={ ( pseudo ) => onChange( { pseudo } ) }
			popoverProps={ dropdownMenuProps.popoverProps }
			showText={ false }
		>
			{ children }
		</StateControl>
	);
}

/**
 * Renders badges for the active style states of a block.
 *
 * @param props                     Component props.
 * @param props.name                Block name.
 * @param props.value               Currently selected style-state value.
 * @param props.isResponsiveEditing Whether Responsive editing is enabled.
 * @return Badges component, or null if there is nothing to show.
 */
export function BlockStateBadges( {
	name,
	value,
	isResponsiveEditing,
}: BlockStateBadgesProps ) {
	const pseudoStateOptions = useMemo(
		() => getPseudoStateOptions( name ),
		[ name ]
	);
	const [ viewportSettings ] = useSettings( 'viewport' );
	const deviceStateOptions = useMemo(
		() => getDeviceStateOptions( viewportSettings ),
		[ viewportSettings ]
	);

	if ( ! pseudoStateOptions.length && ! isResponsiveEditing ) {
		return null;
	}

	return (
		<StateControlBadges
			viewportStates={
				isResponsiveEditing ? deviceStateOptions : EMPTY_STATE_OPTIONS
			}
			pseudoStates={ pseudoStateOptions }
			viewportValue={ value?.viewport ?? DEFAULT_STATE_VALUE }
			pseudoStateValue={ value?.pseudo ?? DEFAULT_STATE_VALUE }
		/>
	);
}
