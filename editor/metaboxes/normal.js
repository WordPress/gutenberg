/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import Metaboxes from './index';

export default function MetaboxesNormal() {
	return (
		<Metaboxes
			context="normal"
			headingText={ __( 'Metaboxes: Below Content' ) }
		/>
	);
}
