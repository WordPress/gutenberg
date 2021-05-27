/**
 * External dependencies
 */


 /**
  * WordPress dependencies
  */
import { RichText, useBlockProps } from '@wordpress/block-editor';

const blockAttributes = {
	ordered: {
		type: 'boolean',
		default: false,
		__experimentalRole: 'content'
		},
	values: {
		type: 'string',
		source: 'html',
		selector: 'ol,ul',
		multiline: 'li',
		__unstableMultilineWrapperTags: [ 'ol', 'ul' ],
		default: '',
		__experimentalRole: 'content'
	},
	type: {
		type: 'string'
	},
	start: {
		type: 'number'
	},
	reversed: {
		type: 'boolean'
	},
	placeholder: {
		type: 'string'
	}
 };

 const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { ordered, values, type, reversed, start } = attributes;
			const TagName = ordered ? 'ol' : 'ul';

			return (
				<TagName { ...useBlockProps.save( { type, reversed, start } ) }>
					<RichText.Content value={ values } multiline="li" />
				</TagName>
			);
		},
	},
 ];

 export default deprecated;
