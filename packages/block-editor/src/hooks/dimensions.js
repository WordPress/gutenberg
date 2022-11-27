/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Platform, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	GapEdit,
	hasGapSupport,
	hasGapValue,
	resetGap,
	useIsGapDisabled,
} from './gap';
import {
	MarginEdit,
	MarginVisualizer,
	hasMarginSupport,
	hasMarginValue,
	resetMargin,
	useIsMarginDisabled,
} from './margin';
import {
	MinHeightEdit,
	hasMinHeightSupport,
	hasMinHeightValue,
	resetMinHeight,
	useIsMinHeightDisabled,
} from './min-height';
import {
	PaddingEdit,
	PaddingVisualizer,
	hasPaddingSupport,
	hasPaddingValue,
	resetPadding,
	useIsPaddingDisabled,
} from './padding';
import {
	ChildLayoutEdit,
	hasChildLayoutSupport,
	hasChildLayoutValue,
	resetChildLayout,
	useIsChildLayoutDisabled,
	childLayoutOrientation,
} from './child-layout';
import useSetting from '../components/use-setting';
import { store as blockEditorStore } from '../store';

export const DIMENSIONS_SUPPORT_KEY = 'dimensions';
export const SPACING_SUPPORT_KEY = 'spacing';
export const ALL_SIDES = [ 'top', 'right', 'bottom', 'left' ];
export const AXIAL_SIDES = [ 'vertical', 'horizontal' ];

function useVisualizerMouseOver() {
	const [ isMouseOver, setIsMouseOver ] = useState( false );
	const {
		__experimentalHideBlockInterface: hideBlockInterface,
		__experimentalShowBlockInterface: showBlockInterface,
	} = useDispatch( blockEditorStore );
	const onMouseOver = ( e ) => {
		e.stopPropagation();
		hideBlockInterface();
		setIsMouseOver( true );
	};
	const onMouseOut = ( e ) => {
		e.stopPropagation();
		showBlockInterface();
		setIsMouseOver( false );
	};
	return { isMouseOver, onMouseOver, onMouseOut };
}

/**
 * Inspector controls for dimensions support.
 *
 * @param {Object} props Block props.
 *
 * @return {WPElement} Inspector controls for dimensions and spacing support features.
 */
export function DimensionsPanel( props ) {
	const isGapDisabled = useIsGapDisabled( props );
	const isPaddingDisabled = useIsPaddingDisabled( props );
	const isMarginDisabled = useIsMarginDisabled( props );
	const isMinHeightDisabled = useIsMinHeightDisabled( props );
	const isChildLayoutDisabled = useIsChildLayoutDisabled( props );
	const isDisabled = useIsDimensionsDisabled( props );
	const isSupported = hasDimensionsSupport( props );
	const spacingSizes = useSetting( 'spacing.spacingSizes' );
	const paddingMouseOver = useVisualizerMouseOver();
	const marginMouseOver = useVisualizerMouseOver();

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	const defaultDimensionsControls = getBlockSupport( props.name, [
		DIMENSIONS_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	const defaultSpacingControls = getBlockSupport( props.name, [
		SPACING_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	const createResetAllFilter =
		( attribute, featureSet ) => ( newAttributes ) => ( {
			...newAttributes,
			style: {
				...newAttributes.style,
				[ featureSet ]: {
					...newAttributes.style?.[ featureSet ],
					[ attribute ]: undefined,
				},
			},
		} );

	const spacingClassnames = classnames( {
		'tools-panel-item-spacing': spacingSizes && spacingSizes.length > 0,
	} );

	const { __unstableParentLayout: parentLayout } = props;

	return (
		<>
			<InspectorControls __experimentalGroup="dimensions">
				{ ! isPaddingDisabled && (
					<ToolsPanelItem
						className={ spacingClassnames }
						hasValue={ () => hasPaddingValue( props ) }
						label={ __( 'Padding' ) }
						onDeselect={ () => resetPadding( props ) }
						resetAllFilter={ createResetAllFilter(
							'padding',
							'spacing'
						) }
						isShownByDefault={ defaultSpacingControls?.padding }
						panelId={ props.clientId }
					>
						<PaddingEdit
							onMouseOver={ paddingMouseOver.onMouseOver }
							onMouseOut={ paddingMouseOver.onMouseOut }
							{ ...props }
						/>
					</ToolsPanelItem>
				) }
				{ ! isMarginDisabled && (
					<ToolsPanelItem
						className={ spacingClassnames }
						hasValue={ () => hasMarginValue( props ) }
						label={ __( 'Margin' ) }
						onDeselect={ () => resetMargin( props ) }
						resetAllFilter={ createResetAllFilter(
							'margin',
							'spacing'
						) }
						isShownByDefault={ defaultSpacingControls?.margin }
						panelId={ props.clientId }
					>
						<MarginEdit
							onMouseOver={ marginMouseOver.onMouseOver }
							onMouseOut={ marginMouseOver.onMouseOut }
							{ ...props }
						/>
					</ToolsPanelItem>
				) }
				{ ! isGapDisabled && (
					<ToolsPanelItem
						className={ spacingClassnames }
						hasValue={ () => hasGapValue( props ) }
						label={ __( 'Block spacing' ) }
						onDeselect={ () => resetGap( props ) }
						resetAllFilter={ createResetAllFilter(
							'blockGap',
							'spacing'
						) }
						isShownByDefault={ defaultSpacingControls?.blockGap }
						panelId={ props.clientId }
					>
						<GapEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isMinHeightDisabled && (
					<ToolsPanelItem
						hasValue={ () => hasMinHeightValue( props ) }
						label={ __( 'Min. height' ) }
						onDeselect={ () => resetMinHeight( props ) }
						resetAllFilter={ createResetAllFilter(
							'minHeight',
							'dimensions'
						) }
						isShownByDefault={
							defaultDimensionsControls?.minHeight
						}
						panelId={ props.clientId }
					>
						<MinHeightEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isChildLayoutDisabled && (
					<VStack
						as={ ToolsPanelItem }
						spacing={ 2 }
						hasValue={ () => hasChildLayoutValue( props ) }
						label={ childLayoutOrientation( parentLayout ) }
						onDeselect={ () => resetChildLayout( props ) }
						resetAllFilter={ createResetAllFilter(
							'selfStretch',
							'layout'
						) }
						isShownByDefault={ false }
						panelId={ props.clientId }
					>
						<ChildLayoutEdit { ...props } />
					</VStack>
				) }
			</InspectorControls>
			{ ! isPaddingDisabled && (
				<PaddingVisualizer
					forceShow={ paddingMouseOver.isMouseOver }
					{ ...props }
				/>
			) }
			{ ! isMarginDisabled && (
				<MarginVisualizer
					forceShow={ marginMouseOver.isMouseOver }
					{ ...props }
				/>
			) }
		</>
	);
}

/**
 * Determine whether there is dimensions related block support.
 *
 * @param {Object} props Block props.
 *
 * @return {boolean} Whether there is support.
 */
export function hasDimensionsSupport( props ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const { name: blockName } = props;

	return (
		hasGapSupport( blockName ) ||
		hasMinHeightSupport( blockName ) ||
		hasPaddingSupport( blockName ) ||
		hasMarginSupport( blockName ) ||
		hasChildLayoutSupport( props )
	);
}

/**
 * Determines whether dimensions support has been disabled.
 *
 * @param {Object} props Block properties.
 *
 * @return {boolean} If spacing support is completely disabled.
 */
const useIsDimensionsDisabled = ( props = {} ) => {
	const gapDisabled = useIsGapDisabled( props );
	const minHeightDisabled = useIsMinHeightDisabled( props );
	const paddingDisabled = useIsPaddingDisabled( props );
	const marginDisabled = useIsMarginDisabled( props );
	const childLayoutDisabled = useIsChildLayoutDisabled( props );

	return (
		gapDisabled &&
		minHeightDisabled &&
		paddingDisabled &&
		marginDisabled &&
		childLayoutDisabled
	);
};

/**
 * Custom hook to retrieve which padding/margin/blockGap is supported
 * e.g. top, right, bottom or left.
 *
 * Sides are opted into by default. It is only if a specific side is set to
 * false that it is omitted.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   The feature custom sides relate to e.g. padding or margins.
 *
 * @return {?string[]} Strings representing the custom sides available.
 */
export function useCustomSides( blockName, feature ) {
	const support = getBlockSupport( blockName, SPACING_SUPPORT_KEY );

	// Skip when setting is boolean as theme isn't setting arbitrary sides.
	if ( ! support || typeof support[ feature ] === 'boolean' ) {
		return;
	}

	// Return if the setting is an array of sides (e.g. `[ 'top', 'bottom' ]`).
	if ( Array.isArray( support[ feature ] ) ) {
		return support[ feature ];
	}

	// Finally, attempt to return `.sides` if the setting is an object.
	if ( support[ feature ]?.sides ) {
		return support[ feature ].sides;
	}
}

/**
 * Custom hook to determine whether the sides configured in the
 * block support are valid. A dimension property cannot declare
 * support for a mix of axial and individual sides.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   The feature custom sides relate to e.g. padding or margins.
 *
 * @return {boolean} If the feature has a valid configuration of sides.
 */
export function useIsDimensionsSupportValid( blockName, feature ) {
	const sides = useCustomSides( blockName, feature );

	if (
		sides &&
		sides.some( ( side ) => ALL_SIDES.includes( side ) ) &&
		sides.some( ( side ) => AXIAL_SIDES.includes( side ) )
	) {
		// eslint-disable-next-line no-console
		console.warn(
			`The ${ feature } support for the "${ blockName }" block can not be configured to support both axial and arbitrary sides.`
		);
		return false;
	}

	return true;
}
