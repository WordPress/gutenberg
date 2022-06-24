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
	const {
		isVisible,
		isPostsPage,
		availableTemplates,
		fetchedTemplates,
		templateAttribute,
		canCreate,
		canEdit,
	} = useSelect( ( select ) => {
		const currentPostType = select( editorStore ).getCurrentPostType();

		const isViewable =
			select( coreStore ).getPostType( currentPostType )?.viewable ??
			false;

		const settings = select( editorStore ).getEditorSettings();

		const canUserCreateTemplates = select( coreStore ).canUser(
			'create',
			'templates'
		);

		const _isVisible =
			isViewable &&
			( settings.availableTemplates?.length ||
				( settings.supportsTemplateMode && canUserCreateTemplates ) );

		if ( ! _isVisible ) {
			return { isVisible: false };
		}

		const _isPostsPage =
			select( editorStore ).getCurrentPostId() ===
			settings?.page_for_posts;

		const _fetchedTemplates = select( coreStore ).getEntityRecords(
			'postType',
			'wp_template',
			{
				post_type: currentPostType,
				per_page: -1,
			}
		);

		const _templateAttribute =
			select( editorStore ).getEditedPostAttribute( 'template' );

		const _canCreate = canUserCreateTemplates && ! _isPostsPage;

		const _canEdit =
			canUserCreateTemplates &&
			settings.supportsTemplateMode &&
			!! select( editPostStore ).getEditedPostTemplate();

		return {
			isVisible: true,
			isPostsPage: _isPostsPage,
			availableTemplates: settings.availableTemplates,
			fetchedTemplates: _fetchedTemplates,
			templateAttribute: _templateAttribute,
			canCreate: _canCreate,
			canEdit: _canEdit,
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );

	const { __unstableSwitchToTemplateMode } = useDispatch( editPostStore );

	const options = useMemo(
		() =>
			Object.entries( {
				...availableTemplates,
				...Object.fromEntries(
					( fetchedTemplates ?? [] ).map( ( { slug, title } ) => [
						slug,
						title.rendered,
					] )
				),
			} ).map( ( [ slug, title ] ) => ( { value: slug, label: title } ) ),
		[ availableTemplates, fetchedTemplates ]
	);

	const selectedOption =
		options.find( ( option ) => option.value === templateAttribute ) ??
		options.find( ( option ) => ! option.value ); // The default option has '' value.

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
