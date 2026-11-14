import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
	setStyleForState,
} from './block-style-state';
import type { BlockStyleState, ChildLayoutBlockStyle } from './types';
import type { ChildLayout } from '../components/child-layout-control/types';

/**
 * Merges child layout changes into the active layout style state.
 *
 * @param style         Block style attributes.
 * @param layout        Child layout changes.
 * @param selectedState Selected block style state.
 * @return Updated block style attributes.
 */
export function getUpdatedChildLayoutStyle(
	style: ChildLayoutBlockStyle | undefined,
	layout: ChildLayout,
	selectedState: BlockStyleState | undefined
): ChildLayoutBlockStyle | undefined {
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return {
			...style,
			layout: {
				...style?.layout,
				...layout,
			},
		};
	}

	const layoutState = {
		// A viewport state is selected here.
		viewport: selectedState!.viewport,
		pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
	};
	// A style state holds the child layout it overrides.
	const stateStyle = getStyleForState( style, layoutState ) as
		ChildLayoutBlockStyle | undefined;

	return setStyleForState( style, layoutState, {
		...stateStyle,
		layout: {
			...stateStyle?.layout,
			...layout,
		},
	} );
}
