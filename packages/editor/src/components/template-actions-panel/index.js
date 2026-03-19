/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import BlockThemeContent from './block-theme-content';
import ClassicThemeContent from './classic-theme-content';

export default function TemplateActionsPanel() {
	const { templateId, isBlockTheme, isVisible } = useSelect( ( select ) => {
		const { getCurrentTemplateId, getEditorSettings, getCurrentPostType } =
			select( editorStore );
		const postType = getCurrentPostType();

		if ( postType !== 'page' && postType !== 'post' ) {
			return { isVisible: false };
		}

		const settings = getEditorSettings();
		const _isBlockTheme = settings.__unstableIsBlockBasedTheme;
		const hasTemplates =
			!! settings.availableTemplates &&
			Object.keys( settings.availableTemplates ).length > 0;

		if (
			! _isBlockTheme &&
			! settings.supportsTemplateMode &&
			! hasTemplates
		) {
			return { isVisible: false };
		}

		return {
			templateId: getCurrentTemplateId(),
			isBlockTheme: _isBlockTheme,
			isVisible: true,
		};
	}, [] );

	const canViewTemplates = useSelect(
		( select ) => {
			return isVisible
				? select( coreStore ).canUser( 'read', {
						kind: 'postType',
						name: 'wp_template',
				  } )
				: false;
		},
		[ isVisible ]
	);

	// Classic themes without template support should not render the panel at all.
	if ( ! isVisible ) {
		return null;
	}

	if ( ! isBlockTheme || ! canViewTemplates ) {
		return <ClassicThemeContent templateId={ templateId } />;
	}

	if ( isBlockTheme && templateId ) {
		return <BlockThemeContent templateId={ templateId } />;
	}

	return null;
}
