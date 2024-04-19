/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostExcerpt from '../post-excerpt';
import PluginPostExcerpt from '../post-excerpt/plugin';
import { store as editorStore } from '../../store';

export function useEditExcerptAction() {
	const { canEditExcerpt, shouldUseDescriptionLabel } = useSelect(
		( select ) => {
			const { getCurrentPostType, isEditorPanelEnabled } =
				select( editorStore );
			const { getPostType } = select( coreStore );
			const postType = getPostType( getCurrentPostType() );
			// TODO: When we are rendering the excerpt/description for templates,
			// template parts and patterns do not abide by the `isEnabled` panel flag.
			// It's not implemented here right now because the actions are to be consolidated
			// and this is rendered only for the rest post types.
			return {
				canEditExcerpt:
					isEditorPanelEnabled( 'post-excerpt' ) &&
					postType?.supports?.excerpt,
				shouldUseDescriptionLabel: [
					'wp_template',
					'wp_template_part',
					'wp_block',
				].includes( postType ),
			};
		},
		[]
	);
	const label = shouldUseDescriptionLabel
		? __( 'Edit description' )
		: __( 'Edit excerpt' );
	return useMemo(
		() => ( {
			id: 'edit-post-excerpt',
			label,
			isEligible() {
				return canEditExcerpt;
			},
			RenderModal: () => {
				return (
					<PluginPostExcerpt.Slot>
						{ ( fills ) => (
							<>
								<PostExcerpt hideLabelFromVision />
								{ fills }
							</>
						) }
					</PluginPostExcerpt.Slot>
				);
			},
		} ),
		[ canEditExcerpt, label ]
	);
}
