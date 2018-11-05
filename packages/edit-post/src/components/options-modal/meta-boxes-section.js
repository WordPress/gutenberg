/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Section from './section';
import { EnableCustomFieldsOption, EnablePanelOption } from './options';

function MetaBoxesSection( { areCustomFieldsRegistered, metaBoxes, ...sectionProps } ) {
	if ( ! areCustomFieldsRegistered && metaBoxes.length === 0 ) {
		return null;
	}

	return (
		<Section { ...sectionProps }>
			{ areCustomFieldsRegistered && (
				<EnableCustomFieldsOption label={ __( 'Custom Fields' ) } />
			) }
			{ map(
				metaBoxes,
				( { id, title } ) =>
					// The 'Custom Fields' meta box is a special case handled above.
					id !== 'postcustom' && (
						<EnablePanelOption key={ id } label={ title } panelName={ `meta-box-${ id }` } />
					)
			) }
		</Section>
	);
}

export default withSelect( ( select ) => {
	const { getEditorSettings } = select( 'core/editor' );
	const { getAllMetaBoxes } = select( 'core/edit-post' );

	return {
		areCustomFieldsRegistered: getEditorSettings().enableCustomFields !== undefined,
		metaBoxes: getAllMetaBoxes(),
	};
} )( MetaBoxesSection );
