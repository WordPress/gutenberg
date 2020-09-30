/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { ALIGNMENT_BREAKPOINTS, WIDE_ALIGNMENTS } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const PIXEL_RATIO = 2;
const MARGIN = 16;

const ReadableContentView = ( {
	align,
	reversed,
	children,
	style,
	parentWidth,
} ) => {
	const { width, height } = Dimensions.get( 'window' );
	const [ resizeObserver, sizes ] = useResizeObserver();
	const { width: containerWidth } = sizes || { width: 0 };
	const [ windowWidth, setWindowWidth ] = useState( width );
	const [ windowRatio, setWindowRatio ] = useState( width / height );

	function onDimensionsChange( { window } ) {
		setWindowWidth( window.width );
		setWindowRatio( window.width / window.height );
	}

	useEffect( () => {
		Dimensions.addEventListener( 'change', onDimensionsChange );

		return () => {
			Dimensions.removeEventListener( 'change', onDimensionsChange );
		};
	}, [] );

	function getWideStyles() {
		if (
			windowRatio >= PIXEL_RATIO &&
			windowWidth < ALIGNMENT_BREAKPOINTS.large
		) {
			return styles.wideLandscape;
		}

		if ( windowWidth <= ALIGNMENT_BREAKPOINTS.small ) {
			return { maxWidth: windowWidth };
		}

		if (
			windowWidth >= ALIGNMENT_BREAKPOINTS.medium &&
			windowWidth < ALIGNMENT_BREAKPOINTS.wide
		) {
			return styles.wideMedium;
		}
	}

	return (
		<View style={ styles.container }>
			{ resizeObserver }
			<View
				style={ [
					reversed
						? styles.reversedCenteredContent
						: styles.centeredContent,
					style,
					styles[ align ],
					parentWidth && {
						maxWidth: containerWidth
							? containerWidth + 2 * MARGIN
							: styles.centeredContent.maxWidth,
					},
					align === WIDE_ALIGNMENTS.alignments.wide &&
						getWideStyles(),
				] }
			>
				{ children }
			</View>
		</View>
	);
};

const isContentMaxWidth = () => {
	const { width } = Dimensions.get( 'window' );
	return width > styles.centeredContent.maxWidth;
};

ReadableContentView.isContentMaxWidth = isContentMaxWidth;

export default ReadableContentView;
