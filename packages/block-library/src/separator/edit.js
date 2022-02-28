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

/**
 * Internal dependencies
 */
import useDeprecatedOpacity from './use-deprecated-opacity';

export default function SeparatorEdit( { attributes, setAttributes } ) {
	const { backgroundColor, opacity, style, className } = attributes;
	const color = useColorProps( attributes );
	const currentColor = color?.style?.backgroundColor;
	const hasCustomColor = !! style?.color?.background;

	useDeprecatedOpacity( opacity, currentColor, setAttributes );

	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const classNames = classnames( {
		'has-text-color': backgroundColor || currentColor,
		[ colorClass ]: colorClass,
		'has-css-opacity': opacity === 'css',
		'has-alpha-channel-opacity': opacity === 'alpha-channel',
	} );

	const styles = {
		color:
			className === 'is-style-dots' && hasCustomColor
				? currentColor
				: undefined,
		backgroundColor:
			className !== 'is-style-dots' && hasCustomColor
				? currentColor
				: undefined,
	};

	return (
		<>
			<HorizontalRule
				{ ...useBlockProps( {
					className: classNames,
					style: hasCustomColor ? styles : undefined,
				} ) }
			/>
		</>
	);
}
