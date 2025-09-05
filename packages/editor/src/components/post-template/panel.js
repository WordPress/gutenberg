/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import ClassicThemeControl from './classic-theme';
import BlockThemeControl from './block-theme';

/**
 * Displays the template controls based on the current editor settings and user permissions.
 *
 * @return {React.ReactNode} The rendered PostTemplatePanel component.
 */
export default function PostTemplatePanel() {
	const { templateId, isBlockTheme } = useSelect( ( select ) => {
		const { getCurrentTemplateId, getEditorSettings } =
			select( editorStore );
		return {
			templateId: getCurrentTemplateId(),
			isBlockTheme: getEditorSettings().__unstableIsBlockBasedTheme,
		};
	}, [] );

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

		if ( ! settings.supportsTemplateMode ) {
			return false;
		}

		const canCreateTemplates =
			select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: 'wp_template',
			} ) ?? false;
		return canCreateTemplates;
	}, [] );

	const canViewTemplates = useSelect( ( select ) => {
		return (
			select( coreStore ).canUser( 'read', {
				kind: 'postType',
				name: 'wp_template',
			} ) ?? false
		);
	}, [] );

	if ( ( ! isBlockTheme || ! canViewTemplates ) && isVisible ) {
		return <ClassicThemeControl />;
	}

	if ( isBlockTheme && !! templateId ) {
		return <BlockThemeControl id={ templateId } />;
	}
	return null;
}
