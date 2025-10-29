/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	store as coreStore,
	privateApis as corePrivateApis,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

/**
 * Hook that returns default template types from the current theme.
 * This is duplicated from edit-site package to avoid cross-package dependencies.
 *
 * @return {Array} Array of default template type objects.
 */
function useDefaultTemplateTypes() {
	return useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()?.default_template_types || [],
		[]
	);
}

/**
 * Hook that returns all default template types, combining theme-provided
 * template types with registered templates from the entity store.
 * This is duplicated from edit-site package to avoid cross-package dependencies.
 *
 * @return {Array} Array of template type objects with slug, title, and description.
 */
function useAllDefaultTemplateTypes() {
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const { records: staticRecords } = useEntityRecordsWithPermissions(
		'root',
		'registeredTemplate'
	);
	return [
		...defaultTemplateTypes,
		...( staticRecords
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

/**
 * Renders the template type panel in the document sidebar.
 * This panel displays the template type (e.g., "Single", "Archive", "Custom")
 * for wp_template post types only, matching the display in dataviews.
 *
 * @return {React.ReactNode|null} The rendered TemplateTypePanel component or null.
 */
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

	console.log( postType, templateSlug );

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
			<span>{ templateTypeLabel }</span>
		</PostPanelRow>
	);
}
