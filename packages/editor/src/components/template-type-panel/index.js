/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

/**
 * Hook that returns all default template types. This is duplicated from
 * edit-site package.
 *
 * @return {Array} Array of template type objects with slug, title, and
 * description.
 */
function useAllDefaultTemplateTypes() {
	const defaultTemplateTypes = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()?.default_template_types || [],
		[]
	);
	const { records: registeredTemplates } = useEntityRecords(
		'root',
		'registeredTemplate'
	);
	return [
		...defaultTemplateTypes,
		...( registeredTemplates
			?.filter( ( record ) => ! record.is_custom )
			.map( ( record ) => {
				return {
					slug: record.slug,
					title: record.title.rendered,
					description: record.description,
				};
			} ) ?? [] ),
	];
}

export default function TemplateTypePanel() {
	const { postType, templateSlug } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const _postType = getCurrentPostType();
		const _postId = getCurrentPostId();
		const template =
			_postType === TEMPLATE_POST_TYPE
				? getEditedEntityRecord(
						'postType',
						TEMPLATE_POST_TYPE,
						_postId
				  )
				: null;

		return {
			postType: _postType,
			templateSlug: template?.slug,
		};
	}, [] );

	const defaultTemplateTypes = useAllDefaultTemplateTypes();

	// Only show this panel for wp_template (not wp_template_part)
	if ( postType !== TEMPLATE_POST_TYPE ) {
		return null;
	}

	// Find the matching template type
	const defaultTemplateType = defaultTemplateTypes.find(
		( type ) => type.slug === templateSlug
	);

	// Display the template type title, or "Custom" if not found
	const templateTypeLabel =
		defaultTemplateType?.title || _x( 'Custom', 'template type' );

	return (
		<PostPanelRow label={ __( 'Type' ) }>
			<div className="editor-template-type-panel__value">
				{ templateTypeLabel }
			</div>
		</PostPanelRow>
	);
}
