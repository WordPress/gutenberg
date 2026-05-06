/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';

const TEMPLATE_CONTENT_BLOCK = 'core/template-content';
const TEMPLATE_PART_BLOCK = 'core/template-part';

/**
 * Adds an "Edit root template" toolbar item to chrome blocks when the Site
 * Editor is wrapping a non-root template inside `root.html`. A chrome block
 * is one of the blocks in `root.html` that lives outside `core/template-
 * content`'s subtree — its editing mode is locked to `'contentOnly'` so it
 * stays selectable, and the toolbar item gives the user a way to switch
 * into editing root.html itself.
 *
 * Returns the unwrapped `BlockEdit` (no extra controls) for blocks that
 * aren't chrome — the inner template's blocks, `template-content` itself,
 * the entire tree when not wrapping, and any post types other than
 * `wp_template`.
 */
const withWrapModeRootEditToolbar = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { clientId, name } = props;
		const {
			innerTemplateId,
			editingMode,
			isInsideInnerTemplate,
			rootPostId,
			rootPostType,
			onNavigateToEntityRecord,
		} = useSelect(
			( select ) => {
				const {
					getSettings,
					getBlockEditingMode,
					getBlockParentsByBlockName,
				} = select( blockEditorStore );
				const { getCurrentPostId, getCurrentPostType } =
					select( editorStore );
				const settings = getSettings();
				return {
					innerTemplateId:
						settings.__experimentalRootInnerTemplateId ?? null,
					editingMode: clientId
						? getBlockEditingMode( clientId )
						: null,
					isInsideInnerTemplate:
						clientId &&
						getBlockParentsByBlockName(
							clientId,
							TEMPLATE_CONTENT_BLOCK
						).length > 0,
					rootPostId: getCurrentPostId(),
					rootPostType: getCurrentPostType(),
					onNavigateToEntityRecord: settings.onNavigateToEntityRecord,
				};
			},
			[ clientId ]
		);

		// `core/template-part` already exposes an "Edit" toolbar action that
		// navigates to the template part entity. Showing "Edit root template"
		// alongside it would be ambiguous, so skip the filter for that block.
		const showToolbar =
			!! innerTemplateId &&
			editingMode === 'contentOnly' &&
			name !== TEMPLATE_CONTENT_BLOCK &&
			name !== TEMPLATE_PART_BLOCK &&
			! isInsideInnerTemplate &&
			!! onNavigateToEntityRecord &&
			!! rootPostId;

		return (
			<>
				{ showToolbar && (
					<BlockControls group="other">
						<ToolbarButton
							onClick={ () =>
								onNavigateToEntityRecord( {
									postId: rootPostId,
									postType: rootPostType,
									focusMode: false,
								} )
							}
						>
							{ __( 'Edit root template' ) }
						</ToolbarButton>
					</BlockControls>
				) }
				<BlockEdit { ...props } />
			</>
		);
	},
	'withWrapModeRootEditToolbar'
);

addFilter(
	'editor.BlockEdit',
	'edit-site/wrap-mode-root-edit-toolbar',
	withWrapModeRootEditToolbar
);
