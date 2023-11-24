/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis } from '@wordpress/patterns';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../store';
import { unlock } from '../lock-unlock';

const { PartialSyncingControls, PATTERN_TYPES } = unlock( privateApis );

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
				select( editSiteStore ).getEditedPostType() ===
				PATTERN_TYPES.user,
			[]
		);

		// Check if editing a pattern and the current block is a paragraph block.
		// Currently, only the paragraph block is supported.
		const shouldShowPartialSyncingControls =
			hasCustomFieldsSupport &&
			props.isSelected &&
			isEditingPattern &&
			blockEditingMode === 'default' &&
			[ 'core/paragraph' ].includes( props.name );

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

if ( window.__experimentalConnections ) {
	addFilter(
		'editor.BlockEdit',
		'core/edit-site/with-partial-syncing-controls',
		withPartialSyncingControls
	);
}
