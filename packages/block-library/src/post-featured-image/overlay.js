/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	withColors,
	__experimentalUseGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { dimRatioToClass } from './utils';

const Overlay = ( { attributes, overlayColor } ) => {
	const { dimRatio } = attributes;
	const { gradientClass, gradientValue } = __experimentalUseGradient();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const borderProps = useBorderProps( attributes );
	const overlayStyles = {
		backgroundColor: overlayColor.color,
		backgroundImage: gradientValue,
		...borderProps.style,
	};

	if ( ! colorGradientSettings.hasColorsOrGradients || ! dimRatio ) {
		return null;
	}

	return (
		<span
			aria-hidden="true"
			className={ classnames(
				'wp-block-post-featured-image__overlay',
				dimRatioToClass( dimRatio ),
				{
					[ overlayColor.class ]: overlayColor.class,
					'has-background-dim': dimRatio !== undefined,
					'has-background-gradient': gradientValue,
					[ gradientClass ]: gradientClass,
				},
				borderProps.className
			) }
			style={ overlayStyles }
		/>
	);
};

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
] )( Overlay );
