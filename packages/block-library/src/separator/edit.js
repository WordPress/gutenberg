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
	const { backgroundColor, opacity } = attributes;

	const color = useColorProps( attributes );
	const currentColor = color?.style?.backgroundColor;

	useDeprecatedOpacity( opacity, currentColor, setAttributes );

	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const className = classnames( {
		'has-text-color': backgroundColor || currentColor,
		[ colorClass ]: colorClass,
		'has-css-opacity': opacity === 'css',
		'has-alpha-channel-opacity': opacity === 'alpha-channel',
	} );

	const styles = {
		color: currentColor,
		backgroundColor: currentColor,
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
