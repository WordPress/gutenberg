/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as preferencesPrivateApis } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import EnableCustomFieldsOption from './enable-custom-fields';
import EnablePanelOption from './enable-panel';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { PreferencesModalSection } = unlock( preferencesPrivateApis );

export function MetaBoxesSection( {
	areCustomFieldsRegistered,
	metaBoxes,
	...sectionProps
} ) {
	// The 'Custom Fields' meta box is a special case that we handle separately.
	const thirdPartyMetaBoxes = metaBoxes.filter(
		( { id } ) => id !== 'postcustom'
	);

	if ( ! areCustomFieldsRegistered && thirdPartyMetaBoxes.length === 0 ) {
		return null;
	}

	return (
		<PreferencesModalSection { ...sectionProps }>
			{ areCustomFieldsRegistered && (
				<EnableCustomFieldsOption label={ __( 'Custom fields' ) } />
			) }
			{ thirdPartyMetaBoxes.map( ( { id, title } ) => (
				<EnablePanelOption
					key={ id }
					label={ title }
					panelName={ `meta-box-${ id }` }
				/>
			) ) }
		</PreferencesModalSection>
	);
}

export default withSelect( ( select ) => {
	const { getEditorSettings } = select( editorStore );
	const { getAllMetaBoxes } = select( editPostStore );

	return {
		// This setting should not live in the block editor's store.
		areCustomFieldsRegistered:
			getEditorSettings().enableCustomFields !== undefined,
		metaBoxes: getAllMetaBoxes(),
	};
} )( MetaBoxesSection );
