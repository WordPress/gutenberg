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

function MetaBoxesSection( { hasCustomFieldsSupport, metaBoxes, ...sectionProps } ) {
	if ( ! hasCustomFieldsSupport && metaBoxes.length === 0 ) {
		return null;
	}

	return (
		<Section { ...sectionProps }>
			{ hasCustomFieldsSupport && (
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
	const { getEditedPostAttribute } = select( 'core/editor' );
	const { getPostType } = select( 'core' );
	const { getAllMetaBoxes } = select( 'core/edit-post' );

	const postType = getPostType( getEditedPostAttribute( 'type' ) );
	return {
		hasCustomFieldsSupport: postType.supports[ 'custom-fields' ],
		metaBoxes: getAllMetaBoxes(),
	};
} )( MetaBoxesSection );
