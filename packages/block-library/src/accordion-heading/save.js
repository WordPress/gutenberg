/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	RichText,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import getIconContent from './get-icon-content';

export default function save( { attributes } ) {
	const { level, title, iconPosition, iconType, showIcon } = attributes;
	const TagName = 'h' + ( level || 3 );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	const blockProps = useBlockProps.save();
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const iconContent = getIconContent( iconType );

	return (
		<TagName { ...blockProps }>
			<button
				type="button"
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
			>
				{ showIcon && iconPosition === 'left' && (
					<span
						className={ `wp-block-accordion-heading__toggle-icon is-icon-${
							iconType || 'plus'
						}` }
						aria-hidden="true"
					>
						{ iconContent }
					</span>
				) }
				<RichText.Content
					className="wp-block-accordion-heading__toggle-title"
					tagName="span"
					value={ title }
					style={ {
						letterSpacing: typographyProps.style.letterSpacing,
						textDecoration: typographyProps.style.textDecoration,
					} }
				/>
				{ showIcon && iconPosition === 'right' && (
					<span
						className={ `wp-block-accordion-heading__toggle-icon is-icon-${
							iconType || 'plus'
						}` }
						aria-hidden="true"
					>
						{ iconContent }
					</span>
				) }
			</button>
		</TagName>
	);
}
