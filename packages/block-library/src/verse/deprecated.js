/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import oldFontFamilyMigration from '../utils/old-font-family-migration';

const blockAttributes = {
	content: {
		type: 'string',
		source: 'html',
		selector: 'pre',
		default: '',
	},
	textAlign: {
		type: 'string',
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const { textAlign, content } = attributes;

			return (
				<RichText.Content
					tagName="pre"
					style={ { textAlign } }
					value={ content }
				/>
			);
		},
	},
	{
		attributes: {
			content: {
				type: 'string',
				source: 'html',
				selector: 'pre',
				default: '',
				__unstablePreserveWhiteSpace: true,
				__experimentalRole: 'content',
			},
			textAlign: {
				type: 'string',
			},
		},
		supports: {
			anchor: true,
			color: {
				gradients: true,
				link: true,
			},
			typography: {
				fontSize: true,
				__experimentalFontFamily: true,
			},
			spacing: {
				padding: true,
			},
		},
		save( { attributes } ) {
			const { textAlign, content } = attributes;

			const className = classnames( {
				[ `has-text-align-${ textAlign }` ]: textAlign,
			} );

			return (
				<pre { ...useBlockProps.save( { className } ) }>
					<RichText.Content value={ content } />
				</pre>
			);
		},
		migrate: oldFontFamilyMigration,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
