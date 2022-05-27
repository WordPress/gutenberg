/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'core/math';
const title = __( 'Math' );

export const math = {
	name,
	title,
	tagName: 'math',
	namespace: 'http://www.w3.org/1998/Math/MathML',
	disabled: true,
	className: null,
	edit() {
		return null;
	},
};
