/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	RichText,
} from '@wordpress/block-editor';

const v1 = {
	attributes: {
		openByDefault: {
			type: 'boolean',
			default: false,
		},
		title: {
			type: 'rich-text',
			source: 'rich-text',
			selector: '.wp-block-accordion-heading__toggle-title',
			role: 'content',
		},
		level: {
			type: 'number',
		},
		iconPosition: {
			type: 'string',
			enum: [ 'left', 'right' ],
			default: 'right',
		},
		showIcon: {
			type: 'boolean',
			default: true,
		},
	},
	supports: {
		anchor: true,
		color: {
			background: true,
			gradients: true,
		},
		align: false,
		interactivity: true,
		spacing: {
			padding: true,
			__experimentalDefaultControls: {
				padding: true,
			},
			__experimentalSkipSerialization: true,
			__experimentalSelector: '.wp-block-accordion-heading__toggle',
		},
		__experimentalBorder: {
			color: true,
			radius: true,
			style: true,
			width: true,
			__experimentalDefaultControls: {
				color: true,
				radius: true,
				style: true,
				width: true,
			},
		},
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
				fontFamily: true,
			},
		},
		shadow: true,
		visibility: false,
	},
	save( { attributes } ) {
		const { level, title, iconPosition, showIcon } = attributes;
		const TagName = 'h' + ( level || 3 );

		const blockProps = useBlockProps.save();
		const spacingProps = getSpacingClassesAndStyles( attributes );

		return (
			<TagName { ...blockProps }>
				<button
					className="wp-block-accordion-heading__toggle"
					style={ spacingProps.style }
				>
					{ showIcon && iconPosition === 'left' && (
						<span
							className="wp-block-accordion-heading__toggle-icon"
							aria-hidden="true"
						>
							+
						</span>
					) }
					<RichText.Content
						className="wp-block-accordion-heading__toggle-title"
						tagName="span"
						value={ title }
					/>
					{ showIcon && iconPosition === 'right' && (
						<span
							className="wp-block-accordion-heading__toggle-icon"
							aria-hidden="true"
						>
							+
						</span>
					) }
				</button>
			</TagName>
		);
	},
};

export default [ v1 ];
