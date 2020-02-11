/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getColorClassName, RichText } from '@wordpress/block-editor';

const blockSupports = {
	className: false,
	anchor: true,
};

const blockAttributes = {
	align: {
		type: 'string',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: 'h1,h2,h3,h4,h5,h6',
		default: '',
	},
	level: {
		type: 'number',
		default: 2,
	},
	placeholder: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
};

const deprecated = [
	{
		attributes: blockAttributes,
		save( { attributes } ) {
			const {
				align,
				content,
				customTextColor,
				level,
				textColor,
			} = attributes;
			const tagName = 'h' + level;

			const textClass = getColorClassName( 'color', textColor );

			const className = classnames( {
				[ textClass ]: textClass,
				[ `has-text-align-${ align }` ]: align,
			} );

			return (
				<RichText.Content
					className={ className ? className : undefined }
					tagName={ tagName }
					style={ {
						color: textClass ? undefined : customTextColor,
					} }
					value={ content }
				/>
			);
		},
		supports: blockSupports,
	},
	{
		supports: blockSupports,
		attributes: blockAttributes,
		save( { attributes } ) {
			const {
				align,
				level,
				content,
				textColor,
				customTextColor,
			} = attributes;
			const tagName = 'h' + level;

			const textClass = getColorClassName( 'color', textColor );

			const className = classnames( {
				[ textClass ]: textClass,
			} );

			return (
				<RichText.Content
					className={ className ? className : undefined }
					tagName={ tagName }
					style={ {
						textAlign: align,
						color: textClass ? undefined : customTextColor,
					} }
					value={ content }
				/>
			);
		},
	},
];

export default deprecated;
