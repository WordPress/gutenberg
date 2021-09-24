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
