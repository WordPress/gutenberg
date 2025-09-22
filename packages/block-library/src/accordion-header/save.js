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
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { level, title, iconPosition, textAlign, showIcon } = attributes;
	const TagName = 'h' + level;

	const blockProps = useBlockProps.save( {
		className: clsx( 'accordion-content__heading', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	return (
		<TagName { ...blockProps }>
			<button
				className={ clsx( 'accordion-content__toggle' ) }
				style={ {
					...spacingProps.style,
				} }
			>
				{ showIcon && iconPosition === 'left' && (
					<span
						className="accordion-content__toggle-icon"
						aria-hidden="true"
					>
						+
					</span>
				) }
				<RichText.Content
					className="accordion-content__toggle-title"
					tagName="span"
					value={ title }
				/>
				{ showIcon && iconPosition === 'right' && (
					<span
						className="accordion-content__toggle-icon"
						aria-hidden="true"
					>
						+
					</span>
				) }
			</button>
		</TagName>
	);
}
