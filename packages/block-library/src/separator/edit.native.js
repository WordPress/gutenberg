/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { HorizontalRule, useConvertUnitToMobile } from '@wordpress/components';
import { withColors, useBlockProps } from '@wordpress/block-editor';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';
import { HEIGHT_CONSTRAINTS } from './shared';

function SeparatorEdit( props ) {
	const {
		attributes: { height, heightUnit },
		setAttributes,
		color,
		setColor,
	} = props;

	const currentMinHeight = HEIGHT_CONSTRAINTS[ heightUnit ].min;
	const currentMaxHeight = HEIGHT_CONSTRAINTS[ heightUnit ].max;

	const convertedHeightValue = useConvertUnitToMobile(
		height || currentMinHeight,
		heightUnit
	);

	const margin = convertedHeightValue / 2;
	const blockProps = useBlockProps();

	// The block's className and styles are moved to the inner <hr> to retain
	// the different styling approaches between themes. The use of bottom
	// borders and background colors prevents using padding internally on the
	// edit component. Adjusting margins leads to losing visual indicators for
	// block selection.
	return (
		<>
			<View
				{ ...blockProps }
				className={ blockProps.className?.replace(
					'wp-block-separator',
					'wp-block-separator__wrapper'
				) }
				style={ { height: convertedHeightValue } }
			>
				<HorizontalRule
					className={ classnames( blockProps.className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
						marginTop: margin,
						marginBottom: margin,
					} }
				/>
			</View>
			<SeparatorSettings
				color={ color }
				setColor={ setColor }
				minHeight={ currentMinHeight }
				maxHeight={ currentMaxHeight }
				height={ height || currentMinHeight }
				heightUnit={ heightUnit }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
