/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';

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
};

const migrateCustomColors = ( attributes ) => {
	if ( ! attributes.customTextColor ) {
		return attributes;
	}
	const style = {
		color: {
			text: attributes.customTextColor,
		},
	};
	return {
		...omit( attributes, [ 'customTextColor' ] ),
		style,
	};
};

const TEXT_ALIGN_OPTIONS = [ 'left', 'right', 'center' ];

const migrateTextAlign = ( attributes ) => {
	const { align, ...rest } = attributes;
	return TEXT_ALIGN_OPTIONS.includes( align )
		? { ...rest, textAlign: align }
		: attributes;
};

const deprecated = [
	{
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			className: false,
			color: { link: true },
			fontSize: true,
			lineHeight: true,
			__experimentalSelector: {
				'core/heading/h1': 'h1',
				'core/heading/h2': 'h2',
				'core/heading/h3': 'h3',
				'core/heading/h4': 'h4',
				'core/heading/h5': 'h5',
				'core/heading/h6': 'h6',
			},
			__unstablePasteTextInline: true,
		},
		attributes: blockAttributes,
		isEligible: ( { align } ) => TEXT_ALIGN_OPTIONS.includes( align ),
		migrate: migrateTextAlign,
		save( { attributes } ) {
			const { align, content, level } = attributes;
			const TagName = 'h' + level;

			const className = classnames( {
				[ `has-text-align-${ align }` ]: align,
			} );

			return (
				<TagName { ...useBlockProps.save( { className } ) }>
					<RichText.Content value={ content } />
				</TagName>
			);
		},
	},
	{
		supports: blockSupports,
		attributes: {
			...blockAttributes,
			customTextColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
		},
		migrate: ( attributes ) =>
			migrateCustomColors( migrateTextAlign( attributes ) ),
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
				'has-text-color': textColor || customTextColor,
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
	},
	{
		attributes: {
			...blockAttributes,
			customTextColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
		},
		migrate: ( attributes ) =>
			migrateCustomColors( migrateTextAlign( attributes ) ),
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
		attributes: {
			...blockAttributes,
			customTextColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
		},
		migrate: ( attributes ) =>
			migrateCustomColors( migrateTextAlign( attributes ) ),
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
