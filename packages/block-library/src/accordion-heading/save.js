/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	RichText,
	getTypographyClassesAndStyles,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { level, title, iconPosition, showIcon } = attributes;
	const TagName = 'h' + ( level || 3 );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	const blockProps = useBlockProps.save( {
		className: clsx( {
			'has-icon': showIcon,
			'has-icon-left': showIcon && iconPosition === 'left',
			'has-icon-right': showIcon && iconPosition === 'right',
		} ),
	} );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	return (
		<TagName { ...blockProps }>
			<button
				type="button"
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
					style={ {
						letterSpacing: typographyProps.style.letterSpacing,
						textDecoration: typographyProps.style.textDecoration,
					} }
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
}
