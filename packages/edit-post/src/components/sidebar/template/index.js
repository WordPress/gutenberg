/**
 * External dependencies
 */
import { partial, isEmpty, map, fromPairs } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { PanelBody, SelectControl } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostTemplateActions from './actions';
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'template';

export function TemplatePanel() {
	const {
		isEnabled,
		isOpened,
		selectedTemplate,
		availableTemplates,
		fetchedTemplates,
		isViewable,
		template,
		supportsTemplateMode,
		canUserCreate,
	} = useSelect( ( select ) => {
		const {
			isEditorPanelEnabled,
			isEditorPanelOpened,
			getEditedPostTemplate,
		} = select( editPostStore );
		const {
			getEditedPostAttribute,
			getEditorSettings,
			getCurrentPostType,
		} = select( editorStore );
		const { getPostType, getEntityRecords, canUser } = select( coreStore );
		const currentPostType = getCurrentPostType();
		const _isViewable = getPostType( currentPostType )?.viewable ?? false;
		const _supportsTemplateMode =
			select( editorStore ).getEditorSettings().supportsTemplateMode &&
			_isViewable;

		const wpTemplates = getEntityRecords( 'postType', 'wp_template', {
			post_type: currentPostType,
			per_page: -1,
		} );

		const newAvailableTemplates = fromPairs(
			( wpTemplates || [] ).map( ( { slug, title } ) => [
				slug,
				title.rendered,
			] )
		);

		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			selectedTemplate: getEditedPostAttribute( 'template' ),
			availableTemplates: getEditorSettings().availableTemplates,
			fetchedTemplates: newAvailableTemplates,
			template: _supportsTemplateMode && getEditedPostTemplate(),
			isViewable: _isViewable,
			supportsTemplateMode: _supportsTemplateMode,
			canUserCreate: canUser( 'create', 'templates' ),
		};
	}, [] );

	const templates = useMemo( () => {
		return {
			...availableTemplates,
			...fetchedTemplates,
		};
	}, [ availableTemplates, fetchedTemplates ] );

	const { toggleEditorPanelOpened } = useDispatch( editPostStore );
	const { editPost } = useDispatch( editorStore );

	if (
		! isEnabled ||
		! isViewable ||
		( isEmpty( availableTemplates ) &&
			( ! supportsTemplateMode || ! canUserCreate ) )
	) {
		return null;
	}

	const onTogglePanel = partial( toggleEditorPanelOpened, PANEL_NAME );

	let panelTitle = __( 'Template' );
	if ( !! template ) {
		panelTitle = sprintf(
			/* translators: %s: template title */
			__( 'Template: %s' ),
			template?.title ?? template.slug
		);
	}

	return (
		<PanelBody
			title={ panelTitle }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<SelectControl
				hideLabelFromVision
				label={ __( 'Template:' ) }
				value={
					Object.keys( templates ).includes( selectedTemplate )
						? selectedTemplate
						: ''
				}
				onChange={ ( templateSlug ) => {
					editPost( {
						template: templateSlug || '',
					} );
				} }
				options={ map( templates, ( templateName, templateSlug ) => ( {
					value: templateSlug,
					label: templateName,
				} ) ) }
			/>
			{ canUserCreate && <PostTemplateActions /> }
		</PanelBody>
	);
}

export default TemplatePanel;
