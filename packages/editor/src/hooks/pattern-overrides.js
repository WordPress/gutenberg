/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

const {
	ResetOverridesControl,
	PATTERN_TYPES,
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
} = unlock( patternsPrivateApis );

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a partial syncing controls to supported blocks in the pattern editor.
 * Currently, only the `core/paragraph` block is supported.
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withPatternOverrideControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isSupportedBlock = Object.keys(
			PARTIAL_SYNCING_SUPPORTED_BLOCKS
		).includes( props.name );

		return (
			<>
				<BlockEdit { ...props } />
				{ props.isSelected && isSupportedBlock && (
					<ControlsWithStoreSubscription { ...props } />
				) }
			</>
		);
	}
);

// Split into a separate component to avoid a store subscription
// on every block.
function ControlsWithStoreSubscription( props ) {
	const blockEditingMode = useBlockEditingMode();
	const isEditingPattern = useSelect(
		( select ) =>
			select( editorStore ).getCurrentPostType() === PATTERN_TYPES.user,
		[]
	);

	const shouldShowResetOverridesControl =
		! isEditingPattern &&
		!! props.attributes.metadata?.name &&
		blockEditingMode !== 'disabled';

	return (
		<>
			{ shouldShowResetOverridesControl && (
				<ResetOverridesControl { ...props } />
			) }
		</>
	);
}

addFilter(
	'editor.BlockEdit',
	'core/editor/with-pattern-override-controls',
	withPatternOverrideControls
);
