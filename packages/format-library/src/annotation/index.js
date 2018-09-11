/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'core/annotation';

export const annotation = {
	name,
	title: __( 'Annotation' ),
	tagName: 'mark',
	className: 'annotation-text',
	attributes: {
		className: 'class',
	},
	edit() {
		return null;
	},
};
