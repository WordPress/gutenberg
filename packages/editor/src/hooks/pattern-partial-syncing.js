/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { useLink } from '../components/routes/link';
import { unlock } from '../lock-unlock';

const {
	PartialSyncingControls,
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
const withPartialSyncingControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const blockEditingMode = useBlockEditingMode();
		const hasCustomFieldsSupport = hasBlockSupport(
			props.name,
			'__experimentalConnections',
			false
		);
		const isEditingPattern = useSelect(
			( select ) =>
				select( editorStore ).getCurrentPostType() ===
				PATTERN_TYPES.user,
			[]
		);

		const shouldShowPartialSyncingControls =
			hasCustomFieldsSupport &&
			props.isSelected &&
			isEditingPattern &&
			blockEditingMode === 'default' &&
			Object.keys( PARTIAL_SYNCING_SUPPORTED_BLOCKS ).includes(
				props.name
			);

		return (
			<>
				<BlockEdit { ...props } />
				{ shouldShowPartialSyncingControls && (
					<PartialSyncingControls { ...props } />
				) }
			</>
		);
	}
);

/**
 * Adds an editOriginalPattern prop which allows the block to switch between post and pattern
 * editing modes.
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withPatternOnlyRenderMode = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/block' ) {
			return <BlockEdit { ...props } />;
		}

		const { onClick } = useLink( {
			postId: props.attributes?.ref,
			postType: 'wp_block',
			canvas: 'edit',
		} );

		const newProps = {
			...props,
			editOriginalPattern: onClick,
		};

		return <BlockEdit { ...newProps } />;
	}
);

if ( window.__experimentalPatternPartialSyncing ) {
	addFilter(
		'editor.BlockEdit',
		'core/editor/with-partial-syncing-controls',
		withPartialSyncingControls
	);
	addFilter(
		'editor.BlockEdit',
		'core/editor/with-pattern-edit-original-mode',
		withPatternOnlyRenderMode
	);
}
