/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, getColorClassName } from '@wordpress/block-editor';

const colorsMigration = ( attributes ) => {
	return omit(
		{
			...attributes,
			customTextColor:
				attributes.textColor && '#' === attributes.textColor[ 0 ]
					? attributes.textColor
					: undefined,
			customBackgroundColor:
				attributes.color && '#' === attributes.color[ 0 ]
					? attributes.color
					: undefined,
		},
		[ 'color', 'textColor' ]
	);
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
			align: {
				type: 'string',
				default: 'none',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
		},
		isEligible( attribute ) {
			return (
				attribute.className &&
				attribute.className.includes( 'is-style-squared' )
			);
		},
		migrate( attributes ) {
			let newClassName = attributes.className;
			if ( newClassName ) {
				newClassName = newClassName
					.replace( /is-style-squared[\s]?/, '' )
					.trim();
			}
			return {
				...attributes,
				className: newClassName ? newClassName : undefined,
				borderRadius: 0,
			};
		},
		save( { attributes } ) {
			const {
				backgroundColor,
				customBackgroundColor,
				customTextColor,
				linkTarget,
				rel,
				text,
				textColor,
				title,
				url,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);

			const buttonClasses = classnames( 'wp-block-button__link', {
				'has-text-color': textColor || customTextColor,
				[ textClass ]: textClass,
				'has-background': backgroundColor || customBackgroundColor,
				[ backgroundClass ]: backgroundClass,
			} );

			const buttonStyle = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			};

			return (
				<div>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
	},
	{
		attributes: {
			...blockAttributes,
			align: {
				type: 'string',
				default: 'none',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
		},
		save( { attributes } ) {
			const {
				url,
				text,
				title,
				backgroundColor,
				textColor,
				customBackgroundColor,
				customTextColor,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);

			const buttonClasses = classnames( 'wp-block-button__link', {
				'has-text-color': textColor || customTextColor,
				[ textClass ]: textClass,
				'has-background': backgroundColor || customBackgroundColor,
				[ backgroundClass ]: backgroundClass,
			} );

			const buttonStyle = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			};

			return (
				<div>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
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
				<div
					className={ `align${ align }` }
					style={ { backgroundColor: color } }
				>
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
