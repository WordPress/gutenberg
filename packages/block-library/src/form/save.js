/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
	getTypographyClassesAndStyles as useTypographyProps,
} from '@wordpress/block-editor';

/**
 * External dependencies
 */
import classNames from 'classnames';

const Save = ( { attributes, className } ) => {
	const blockProps = useBlockProps.save();
	const { submissionMethod } = attributes;

	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );
	const typographyProps = useTypographyProps( attributes );

	return (
		<form
			{ ...blockProps }
			style={ {
				...borderProps.style,
				...colorProps.style,
				...spacingProps.style,
				...typographyProps.style,
			} }
			className={ classNames(
				className,
				'wp-block-form',
				colorProps.className,
				borderProps.className,
				spacingProps.className,
				typographyProps.className
			) }
			encType={ submissionMethod === 'email' ? 'text/plain' : null }
		>
			<InnerBlocks.Content />
		</form>
	);
};
export default Save;
