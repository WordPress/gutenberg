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

	// V1 blocks expect to have a default opacity of 0.4, so on transformation
	// get an opacity attribute set to css in order to assign a class name
	// to provide this opactiy. Once the user changes the color this is removed
	// and opacity can then be set via the color block support alpha channel.

	useEffect( () => {
		if ( ! opacity ) {
			setAttributes( { opacity: 'alpha-channel' } );
		}
	}, [ opacity ] );

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
