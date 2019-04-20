/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_STYLE_NAME } from './shared';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name, attributes: blockAttributes } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Pullquote' ),
	description: __( 'Give special visual emphasis to a quote from your text.' ),
	icon,
	styles: [
		{ name: 'default', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: SOLID_COLOR_STYLE_NAME, label: __( 'Solid Color' ) },
	],
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
	},
	edit,
	save,
	deprecated: [ {
		attributes: {
			...blockAttributes,
		},
		save( { attributes } ) {
			const { value, citation } = attributes;
			return (
				<blockquote>
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
				</blockquote>
			);
		},
	}, {
		attributes: {
			...blockAttributes,
			citation: {
				type: 'string',
				source: 'html',
				selector: 'footer',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},

		save( { attributes } ) {
			const { value, citation, align } = attributes;

			return (
				<blockquote className={ `align${ align }` }>
					<RichText.Content value={ value } multiline />
					{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
				</blockquote>
			);
		},
	} ],
};
