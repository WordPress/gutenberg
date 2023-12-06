/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import ClassicThemeControl from './classic-theme';
import BlockThemeControl from './block-theme';
import PostPanelRow from '../post-panel-row';

export default function PostTemplatePanel() {
	const templateId = useSelect(
		( select ) => select( editorStore ).getCurrentTemplateId(),
		[]
	);

	const isVisible = useSelect( ( select ) => {
		const postTypeSlug = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( postTypeSlug );
		if ( ! postType?.viewable ) {
			return false;
		}

		const settings = select( editorStore ).getEditorSettings();
		const hasTemplates =
			!! settings.availableTemplates &&
			Object.keys( settings.availableTemplates ).length > 0;
		if ( hasTemplates ) {
			return true;
		}

		return false;
	}, [] );

	if ( ! isVisible && ! templateId ) {
		return null;
	}

	const isBlockTheme = !! templateId;

	if ( ! isBlockTheme ) {
		return (
			<PostPanelRow className="editor-post-template__panel-classic">
				<ClassicThemeControl />
			</PostPanelRow>
		);
	}

	return (
		<PostPanelRow label={ __( 'Template' ) }>
			<BlockThemeControl id={ templateId } />
		</PostPanelRow>
	);
}
