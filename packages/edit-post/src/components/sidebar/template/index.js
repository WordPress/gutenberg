/**
 * External dependencies
 */
import { partial, isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
		isViewable,
		template,
		supportsTemplateMode,
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
		const { getPostType } = select( coreStore );
		const _isViewable =
			getPostType( getCurrentPostType() )?.viewable ?? false;
		const _supportsTemplateMode =
			select( editorStore ).getEditorSettings().supportsTemplateMode &&
			_isViewable;

		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			selectedTemplate: getEditedPostAttribute( 'template' ),
			availableTemplates: getEditorSettings().availableTemplates,
			template: _supportsTemplateMode && getEditedPostTemplate(),
			isViewable: _isViewable,
			supportsTemplateMode: _supportsTemplateMode,
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editPostStore );
	const { editPost } = useDispatch( editorStore );

	if (
		! isEnabled ||
		! isViewable ||
		( isEmpty( availableTemplates ) && ! supportsTemplateMode )
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
				value={ selectedTemplate }
				onChange={ ( templateSlug ) => {
					editPost( {
						template: templateSlug || '',
					} );
				} }
				options={ map(
					availableTemplates,
					( templateName, templateSlug ) => ( {
						value: templateSlug,
						label: templateName,
					} )
				) }
			/>
			<PostTemplateActions />
		</PanelBody>
	);
}

export default TemplatePanel;
