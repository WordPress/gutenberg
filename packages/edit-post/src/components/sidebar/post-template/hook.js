/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default function usePostTemplateForm() {
	const isViewable = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		const { getPostType } = select( coreStore );
		return getPostType( getCurrentPostType() )?.viewable ?? false;
	}, [] );

	const settings = useSelect(
		( select ) => select( editorStore ).getEditorSettings(),
		[]
	);

	const canUserCreateTemplate = useSelect(
		( select ) => select( coreStore ).canUser( 'create', 'templates' ),
		[]
	);

	const currentPostId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);

	const templates = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		const { getEntityRecords } = select( coreStore );
		return getEntityRecords( 'postType', 'wp_template', {
			post_type: getCurrentPostType(),
			per_page: -1,
		} );
	}, [] );

	const templateAttribute = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'template' ),
		[]
	);

	const template = useSelect(
		( select ) => select( editPostStore ).getEditedPostTemplate(),
		[]
	);

	const { editPost } = useDispatch( editorStore );

	const { __unstableSwitchToTemplateMode } = useDispatch( editPostStore );

	const isVisible =
		isViewable &&
		( settings.availableTemplates?.length ||
			( settings.supportsTemplateMode && canUserCreateTemplate ) );

	const isPostsPage = currentPostId === settings?.page_for_posts;

	const options = useMemo(
		() =>
			Object.entries( {
				...settings.availableTemplates,
				...Object.fromEntries(
					( templates ?? [] ).map( ( { slug, title } ) => [
						slug,
						title.rendered,
					] )
				),
			} ).map( ( [ slug, title ] ) => ( { value: slug, label: title } ) ),
		[ settings.availableTemplates, templates ]
	);

	const selectedOption =
		options.find( ( option ) => option.value === templateAttribute ) ??
		options.find( ( option ) => ! option.value ); // The default option has '' value.

	const canCreate = canUserCreateTemplate && ! isPostsPage;

	const canEdit =
		canUserCreateTemplate && settings.supportsTemplateMode && !! template;

	const onChange = useCallback( ( slug ) => {
		editPost( {
			template: slug || '',
		} );
	}, [] );

	const onEdit = useCallback( () => {
		__unstableSwitchToTemplateMode();
	}, [] );

	return {
		isVisible,
		isPostsPage,
		selectedOption,
		options,
		canCreate,
		canEdit,
		onChange,
		onEdit,
	};
}
