/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import migrateTextAlign from '../utils/migrate-text-align';

const v1 = {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'pre',
			default: '',
		},
		textAlign: {
			type: 'string',
		},
	},
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
	migrate: migrateTextAlign,
};

const v2 = {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'pre',
			default: '',
			__unstablePreserveWhiteSpace: true,
			role: 'content',
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

		const className = clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} );

		return (
			<pre { ...useBlockProps.save( { className } ) }>
				<RichText.Content value={ content } />
			</pre>
		);
	},
	migrate( attributes ) {
		return migrateTextAlign( migrateFontFamily( attributes ) );
	},
	isEligible( { style, textAlign } ) {
		return style?.typography?.fontFamily || !! textAlign;
	},
};

const v3 = {
	attributes: {
		content: {
			type: 'rich-text',
			source: 'rich-text',
			selector: 'pre',
			__unstablePreserveWhiteSpace: true,
			role: 'content',
		},
		textAlign: {
			type: 'string',
		},
	},
	supports: {
		anchor: true,
		background: {
			backgroundImage: true,
			backgroundSize: true,
		},
		color: {
			gradients: true,
			link: true,
		},
		dimensions: {
			minHeight: true,
		},
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			lineHeight: true,
			__experimentalFontStyle: true,
			__experimentalFontWeight: true,
			__experimentalLetterSpacing: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalWritingMode: true,
		},
		spacing: {
			margin: true,
			padding: true,
		},
		__experimentalBorder: {
			radius: true,
			width: true,
			color: true,
			style: true,
		},
		interactivity: {
			clientNavigation: true,
		},
	},
	save( { attributes } ) {
		const { textAlign, content } = attributes;

		const className = clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} );

		return (
			<pre { ...useBlockProps.save( { className } ) }>
				<RichText.Content value={ content } />
			</pre>
		);
	},
	migrate: migrateTextAlign,
	isEligible( attributes ) {
		return (
			!! attributes.textAlign ||
			!! attributes.className?.match(
				/\bhas-text-align-(left|center|right)\b/
			)
		);
	},
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v3, v2, v1 ];
