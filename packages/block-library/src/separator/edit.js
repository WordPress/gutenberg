/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { HorizontalRule } from '@wordpress/components';
import {
	useBlockProps,
	getColorClassName,
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';

export default function SeparatorEdit( { attributes } ) {
	const { backgroundColor, style } = attributes;
	const color = useColorProps( attributes );

	const customColor = style?.color?.background;
	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const className = classnames( {
		'has-text-color': backgroundColor || customColor,
		[ colorClass ]: colorClass,
	} );

	const styles = {
		color: color?.style?.backgroundColor,
		backgroundColor: color?.style?.backgroundColor,
	};

	return (
		<>
			<HorizontalRule
				{ ...useBlockProps( {
					className,
					style: styles,
				} ) }
			/>
		</>
	);
}
