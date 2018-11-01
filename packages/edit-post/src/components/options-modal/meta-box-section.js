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

function MetaBoxSection( { metaBoxes = [], ...sectionProps } ) {
	return (
		<Section { ...sectionProps }>
			<EnableCustomFieldsOption label={ __( 'Custom Fields' ) } />
			{ map(
				metaBoxes,
				( { title, id } ) =>
					// The 'Custom Fields' meta box is a special case handled above.
					id !== 'postcustom' && (
						<EnablePanelOption key={ id } label={ title } panelName={ `meta-box-${ id }` } />
					)
			) }
		</Section>
	);
}

export default withSelect( ( select ) => ( {
	metaBoxes: select( 'core/edit-post' ).getAllMetaBoxes(),
} ) )( MetaBoxSection );
