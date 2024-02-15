/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { isPreviewingTheme } from '../../utils/is-previewing-theme';

const PREFERENCE_NAME = 'isTemplatePartMoveHintVisible';

export default function TemplatePartHint() {
	const showTemplatePartHint = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', PREFERENCE_NAME ) ?? true,
		[]
	);

	const { set: setPreference } = useDispatch( preferencesStore );
	if ( ! showTemplatePartHint || isPreviewingTheme() ) {
		return null;
	}

	return (
		<Notice
			politeness="polite"
			className="edit-site-sidebar__notice"
			onRemove={ () => {
				setPreference( 'core', PREFERENCE_NAME, false );
			} }
		>
			{ __( 'Looking for template parts? Find them in "Patterns".' ) }
		</Notice>
	);
}
