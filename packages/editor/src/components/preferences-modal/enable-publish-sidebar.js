/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as preferencesPrivateApis } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { PreferenceBaseOption } = unlock( preferencesPrivateApis );

export default function EnablePublishSidebarOption( props ) {
	const isChecked = useSelect( ( select ) => {
		return select( editorStore ).isPublishSidebarEnabled();
	}, [] );
	const { enablePublishSidebar, disablePublishSidebar } =
		useDispatch( editorStore );

	return (
		<PreferenceBaseOption
			isChecked={ isChecked }
			onChange={ ( isEnabled ) =>
				isEnabled ? enablePublishSidebar() : disablePublishSidebar()
			}
			{ ...props }
		/>
	);
}
