/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import useBlockVisibility from './use-block-visibility';
import { deviceTypeKey } from '../../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';

const { Badge } = unlock( componentsPrivateApis );
const DEFAULT_VISIBILITY_STATE = {
	currentBlockVisibility: undefined,
	hasParentHiddenEverywhere: false,
	selectedDeviceType: BLOCK_VISIBILITY_VIEWPORTS.desktop.value,
};

export default function ViewportVisibilityInfo( { clientId } ) {
	const {
		currentBlockVisibility,
		selectedDeviceType,
		hasParentHiddenEverywhere,
	} = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return DEFAULT_VISIBILITY_STATE;
			}
			const {
				getBlockAttributes,
				isBlockParentHiddenEverywhere,
				getSettings,
			} = unlock( select( blockEditorStore ) );

			return {
				currentBlockVisibility:
					getBlockAttributes( clientId )?.metadata?.blockVisibility,
				selectedDeviceType:
					getSettings()?.[ deviceTypeKey ]?.toLowerCase() ||
					BLOCK_VISIBILITY_VIEWPORTS.desktop.value,
				hasParentHiddenEverywhere:
					isBlockParentHiddenEverywhere( clientId ),
			};
		},
		[ clientId ]
	);

	// Use hook to get current viewport and if block is currently hidden (accurate viewport detection)
	const { isBlockCurrentlyHidden, currentViewport } = useBlockVisibility( {
		blockVisibility: currentBlockVisibility,
		deviceType: selectedDeviceType,
	} );

	/*
	 * Selector to check if any parent (immediate or further up the chain) is hidden at current viewport.
	 * Separated because it depends on currentViewport from the hook above.
	 */
	const isBlockParentHiddenAtViewport = useSelect(
		( select ) => {
			if ( ! clientId || ! currentViewport ) {
				return false;
			}
			return unlock(
				select( blockEditorStore )
			).isBlockParentHiddenAtViewport( clientId, currentViewport );
		},
		[ clientId, currentViewport ]
	);

	if (
		! (
			isBlockCurrentlyHidden ||
			hasParentHiddenEverywhere ||
			isBlockParentHiddenAtViewport
		)
	) {
		return null;
	}

	// Determine label based on whether block or parent is hidden
	let label;
	if ( isBlockCurrentlyHidden ) {
		// Block is currently hidden - check if hidden everywhere or at specific viewport
		if ( currentBlockVisibility === false ) {
			label = __( 'Block is hidden' );
		} else {
			const viewportLabel =
				BLOCK_VISIBILITY_VIEWPORTS[ currentViewport ]?.label ||
				currentViewport;
			label = sprintf(
				/* translators: %s: viewport name (Desktop, Tablet, Mobile) */
				__( 'Block is hidden on %s' ),
				viewportLabel
			);
		}
	}

	// Parent is hidden - check if hidden everywhere or at specific viewport
	if ( hasParentHiddenEverywhere ) {
		label = __( 'Parent block is hidden' );
	} else if ( isBlockParentHiddenAtViewport ) {
		const viewportLabel =
			BLOCK_VISIBILITY_VIEWPORTS[ currentViewport ]?.label ||
			currentViewport;
		label = sprintf(
			/* translators: %s: viewport name (Desktop, Tablet, Mobile) */
			__( 'Parent block is hidden on %s' ),
			viewportLabel
		);
	}

	return (
		<Badge className="block-editor-block-visibility-info">
			<HStack spacing={ 2 } justify="start">
				<Icon icon={ unseen } />
				<Text>{ label }</Text>
			</HStack>
		</Badge>
	);
}
