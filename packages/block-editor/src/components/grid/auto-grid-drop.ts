import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
} from '../../hooks/block-style-state';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child-utils';
import type { BlockStyleState, ChildLayoutBlockStyle } from '../../hooks/types';
import type { Layout } from '../../layouts/types';
import { isPlainObject } from '../../utils/object';
import { hasExplicitGridPlacement } from './utils';

/**
 * Returns the style change that makes an explicitly placed child of an auto
 * grid participate in auto-placement again.
 *
 * @param parentLayout  The parent block's resolved layout.
 * @param style         Block style attributes.
 * @param selectedState Selected block style state.
 *
 * @return The updated style and whether it should be applied.
 */
export function getAutoGridItemStyleAfterDrop(
	parentLayout: Layout | undefined,
	style: unknown,
	selectedState: BlockStyleState | undefined
): {
	style?: ChildLayoutBlockStyle;
	shouldReset: boolean;
} {
	if (
		! isPlainObject( parentLayout ) ||
		parentLayout.type !== 'grid' ||
		parentLayout.isManualPlacement ||
		! isPlainObject( style )
	) {
		return { shouldReset: false };
	}

	const stateStyle = getStyleForState( style, {
		...selectedState,
		pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
	} );
	const baseLayout = isPlainObject( style.layout ) ? style.layout : {};
	const stateLayout = isPlainObject( stateStyle?.layout )
		? stateStyle.layout
		: {};
	if ( ! hasExplicitGridPlacement( { ...baseLayout, ...stateLayout } ) ) {
		return { shouldReset: false };
	}
	// Dropping explicitly chooses auto placement instead of inheriting a pin.
	const automaticStart = hasViewportBlockStyleState( selectedState )
		? null
		: undefined;

	return {
		style: getUpdatedChildLayoutStyle(
			style as ChildLayoutBlockStyle,
			{ columnStart: automaticStart, rowStart: automaticStart },
			selectedState
		),
		shouldReset: true,
	};
}
