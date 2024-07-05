/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { memo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

const {
	PatternOverridesControls,
	ResetOverridesControl,
	PatternOverridesBlockControls,
	PATTERN_TYPES,
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
	PATTERN_SYNC_TYPES,
} = unlock( patternsPrivateApis );

// Split into a separate component to avoid a store subscription
// on every block.
const MemoizedControlsWithStoreSubscription = memo(
	function ControlsWithStoreSubscription( props ) {
		const blockEditingMode = useBlockEditingMode();
		const { hasPatternOverridesSource, isEditingSyncedPattern } = useSelect(
			( select ) => {
				const { getBlockBindingsSource } = unlock(
					select( blocksStore )
				);
				const { getCurrentPostType, getEditedPostAttribute } =
					select( editorStore );

				return {
					// For editing link to the site editor if the theme and user permissions support it.
					hasPatternOverridesSource: !! getBlockBindingsSource(
						'core/pattern-overrides'
					),
					isEditingSyncedPattern:
						getCurrentPostType() === PATTERN_TYPES.user &&
						getEditedPostAttribute( 'meta' )
							?.wp_pattern_sync_status !==
							PATTERN_SYNC_TYPES.unsynced &&
						getEditedPostAttribute( 'wp_pattern_sync_status' ) !==
							PATTERN_SYNC_TYPES.unsynced,
				};
			},
			[]
		);

		const bindings = props.metadata?.bindings;
		const hasPatternBindings =
			!! bindings &&
			Object.values( bindings ).some(
				( binding ) => binding.source === 'core/pattern-overrides'
			);

		const shouldShowPatternOverridesControls =
			isEditingSyncedPattern && blockEditingMode === 'default';
		const shouldShowResetOverridesControl =
			! isEditingSyncedPattern &&
			!! props.metadata?.name &&
			blockEditingMode !== 'disabled' &&
			hasPatternBindings;

		if ( ! hasPatternOverridesSource ) {
			return null;
		}

		return (
			<>
				{ shouldShowPatternOverridesControls && (
					<PatternOverridesControls { ...props } />
				) }
				{ shouldShowResetOverridesControl && (
					<ResetOverridesControl { ...props } />
				) }
			</>
		);
	}
);

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
		const isSupportedBlock =
			!! PARTIAL_SYNCING_SUPPORTED_BLOCKS[ props.name ];

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && isSupportedBlock && (
					<MemoizedControlsWithStoreSubscription
						clientId={ props.clientId }
						name={ props.name }
						metadata={ props.attributes.metadata }
						setAttributes={ props.setAttributes }
						hasUnsupportedAttributes={
							props.name === 'core/image' &&
							( !! props.attributes.caption?.length ||
								!! props.attributes.href?.length )
						}
					/>
				) }
				{ isSupportedBlock && <PatternOverridesBlockControls /> }
			</>
		);
	},
	'withPatternOverrideControls'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/with-pattern-override-controls',
	withPatternOverrideControls
);
