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
	const {
		level,
		title,
		iconPosition,
		showIcon,
		expandIconUrl,
		collapseIconUrl,
	} = attributes;
	const TagName = 'h' + ( level || 3 );
	const typographyProps = getTypographyClassesAndStyles( attributes );

	const blockProps = useBlockProps.save();
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const renderIcon = () => (
		<span
			className="wp-block-accordion-heading__toggle-icon"
			aria-hidden="true"
		>
			{ expandIconUrl ? (
				<img
					src={ expandIconUrl }
					className="wp-block-accordion-heading__icon-expand"
					alt="Expand icon"
				/>
			) : (
				<span className="wp-block-accordion-heading__icon-expand">
					+
				</span>
			) }

			{ collapseIconUrl ? (
				<img
					src={ collapseIconUrl }
					className="wp-block-accordion-heading__icon-collapse"
					alt="Collapse icon"
				/>
			) : (
				<span className="wp-block-accordion-heading__icon-collapse">
					&times;
				</span>
			) }
		</span>
	);

	return (
		<TagName { ...blockProps }>
			<button
				className="wp-block-accordion-heading__toggle"
				style={ spacingProps.style }
			>
				{ showIcon && iconPosition === 'left' && renderIcon() }
				<RichText.Content
					className="wp-block-accordion-heading__toggle-title"
					tagName="span"
					value={ title }
					style={ {
						letterSpacing: typographyProps.style.letterSpacing,
						textDecoration: typographyProps.style.textDecoration,
					} }
				/>
				{ showIcon && iconPosition === 'right' && renderIcon() }
			</button>
		</TagName>
	);
}
