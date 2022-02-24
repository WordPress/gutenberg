/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { HorizontalRule } from '@wordpress/components';
import {
	useBlockProps,
	getColorClassName,
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';
import { usePrevious } from '@wordpress/compose';

export default function SeparatorEdit( { attributes, setAttributes } ) {
	const { backgroundColor, style, opacity } = attributes;
	const color = useColorProps( attributes );

	const previousClassName = usePrevious( color.className );
	useEffect( () => {
		if (
			previousClassName &&
			opacity === 'css' &&
			color.className !== previousClassName
		) {
			setAttributes( { opacity: 'alpha-channel' } );
		}
	}, [ color.className, previousClassName ] );

	const customColor = style?.color?.background;
	// The dots styles uses text for the dots, to change those dots color is
	// using color, not backgroundColor.
	const colorClass = getColorClassName( 'color', backgroundColor );

	const className = classnames( {
		'has-text-color': backgroundColor || customColor,
		[ colorClass ]: colorClass,
		'has-css-opacity': opacity === 'css',
		'has-alpha-channel-opacity': opacity === 'alpha-channel',
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
