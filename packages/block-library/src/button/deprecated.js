/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

const colorsMigration = ( attributes ) => {
	return omit( {
		...attributes,
		customTextColor: attributes.textColor && '#' === attributes.textColor[ 0 ] ? attributes.textColor : undefined,
		customBackgroundColor: attributes.color && '#' === attributes.color[ 0 ] ? attributes.color : undefined,
	}, [ 'color', 'textColor' ] );
};

const blockAttributes = {
	url: {
		type: 'string',
		source: 'attribute',
		selector: 'a',
		attribute: 'href',
	},
	title: {
		type: 'string',
		source: 'attribute',
		selector: 'a',
		attribute: 'title',
	},
	text: {
		type: 'string',
		source: 'html',
		selector: 'a',
	},
};

const deprecated = [
	{
		attributes: {
			...blockAttributes,
			color: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},
		save( { attributes } ) {
			const { url, text, title, align, color, textColor } = attributes;

			const buttonStyle = {
				backgroundColor: color,
				color: textColor,
			};

			const linkClass = 'wp-block-button__link';

			return (
				<div className={ `align${ align }` }>
					<RichText.Content
						tagName="a"
						className={ linkClass }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
					/>
				</div>
			);
		},
		migrate: colorsMigration,
	},
	{
		attributes: {
			...blockAttributes,
			color: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},
		save( { attributes } ) {
			const { url, text, title, align, color, textColor } = attributes;

			return (
				<div className={ `align${ align }` } style={ { backgroundColor: color } }>
					<RichText.Content
						tagName="a"
						href={ url }
						title={ title }
						style={ { color: textColor } }
						value={ text }
					/>
				</div>
			);
		},
		migrate: colorsMigration,
	},
];

export default deprecated;
