/**
 * External dependencies
 */
import { filter, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { PreferencesModalSection } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { EnableCustomFieldsOption, EnablePanelOption } from './options';
import { store as editPostStore } from '../../store';

export function MetaBoxesSection( {
	areCustomFieldsRegistered,
	metaBoxes,
	...sectionProps
} ) {
	// The 'Custom Fields' meta box is a special case that we handle separately.
	const thirdPartyMetaBoxes = filter(
		metaBoxes,
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
			{ map( thirdPartyMetaBoxes, ( { id, title } ) => (
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
