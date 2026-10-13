import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	privateApis as preferencesPrivateApis,
	store as preferencesStore,
} from '@wordpress/preferences';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';
import { MetaBoxesSection } from './meta-boxes-section';

const { PreferenceBaseOption, PreferenceToggleControl } = unlock(
	preferencesPrivateApis
);
const { PreferencesModal } = unlock( editorPrivateApis );

export default function EditPostPreferencesModal() {
	const isPinned = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const pinned = get( 'core/edit-post', 'metaBoxesMainIsPinned' );
		const openHeight = get( 'core/edit-post', 'metaBoxesMainOpenHeight' );
		// A saved height keeps the pane pinned when the flag was never stored.
		return pinned ?? typeof openHeight === 'number';
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );
	const extraSections = {
		general: (
			<>
				<MetaBoxesSection title={ __( 'Advanced' ) } />
				<PreferenceBaseOption
					label={ __( 'Pin meta boxes to the bottom' ) }
					help={ __(
						'Keep meta boxes in a resizable pane. Otherwise they appear below the content.'
					) }
					isChecked={ !! isPinned }
					onChange={ () => {
						setPreference(
							'core/edit-post',
							'metaBoxesMainIsPinned',
							! isPinned
						);
						if ( ! isPinned ) {
							setPreference(
								'core/edit-post',
								'metaBoxesMainIsOpen',
								true
							);
						}
					} }
				/>
			</>
		),
		appearance: (
			<PreferenceToggleControl
				scope="core/edit-post"
				featureName="themeStyles"
				help={ __( 'Make the editor look like your theme.' ) }
				label={ __( 'Use theme styles' ) }
			/>
		),
	};

	return <PreferencesModal extraSections={ extraSections } />;
}
