import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as preferencesPrivateApis } from '@wordpress/preferences';
import EnableCustomFieldsOption from './enable-custom-fields';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { PreferencesModalSection, PreferenceBaseOption } = unlock(
	preferencesPrivateApis
);

export function MetaBoxesSection( sectionProps ) {
	const { areCustomFieldsRegistered, metaBoxes } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { getAllMetaBoxes } = select( editPostStore );

		return {
			areCustomFieldsRegistered:
				getEditorSettings().enableCustomFields !== undefined,
			metaBoxes: getAllMetaBoxes(),
		};
	}, [] );
	const editPostDispatch = useDispatch( editPostStore );

	// The 'Custom Fields' meta box is a special case that we handle separately.
	const thirdPartyMetaBoxes = metaBoxes.filter(
		( { id } ) => id !== 'postcustom'
	);

	if ( ! areCustomFieldsRegistered && thirdPartyMetaBoxes.length === 0 ) {
		return null;
	}

	const { setMetaBoxHidden } = unlock( editPostDispatch );

	return (
		<PreferencesModalSection { ...sectionProps }>
			{ areCustomFieldsRegistered && (
				<EnableCustomFieldsOption label={ __( 'Custom fields' ) } />
			) }
			{ thirdPartyMetaBoxes.map( ( { id, title, hidden } ) => (
				<PreferenceBaseOption
					key={ id }
					label={ title }
					isChecked={ ! hidden }
					onChange={ () => setMetaBoxHidden( id, ! hidden ) }
				/>
			) ) }
		</PreferencesModalSection>
	);
}
