/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import cleanEmptyObject from '../utils/clean-empty-object';

/**
 * Migrates the current style.typography.fontFamily attribute,
 * whose value was "var:preset|font-family|helvetica-arial",
 * to the style.fontFamily attribute, whose value will be "helvetica-arial".
 *
 * @param {Object} attributes The current attributes
 * @return {Object} The updated attributes.
 */
const oldFontFamilyMigration = ( attributes ) => {
	if ( ! attributes?.style?.typography?.fontFamily ) {
		return attributes;
	}

	const fontFamily = attributes.style.typography.fontFamily
		.split( '|' )
		.pop();
	delete attributes.style.typography.fontFamily;
	attributes.style = cleanEmptyObject( attributes.style );

	return {
		...attributes,
		fontFamily,
	};
};

const deprecated = [
	{
		attributes: {
			ordered: {
				type: 'boolean',
				default: false,
				__experimentalRole: 'content',
			},
			values: {
				type: 'string',
				source: 'html',
				selector: 'ol,ul',
				multiline: 'li',
				__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
				default: '',
				__experimentalRole: 'content',
			},
			type: {
				type: 'string',
			},
			start: {
				type: 'number',
			},
			reversed: {
				type: 'boolean',
			},
			placeholder: {
				type: 'string',
			},
		},
		supports: {
			anchor: true,
			className: false,
			typography: {
				fontSize: true,
				__experimentalFontFamily: true,
			},
			color: {
				gradients: true,
				link: true,
			},
			__unstablePasteTextInline: true,
			__experimentalSelector: 'ol,ul',
		},
		save( { attributes } ) {
			const { ordered, values, type, reversed, start } = attributes;
			const TagName = ordered ? 'ol' : 'ul';

			return (
				<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
					<RichText.Content value={ values } multiline="li" />
				</TagName>
			);
		},
		migrate: oldFontFamilyMigration,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
