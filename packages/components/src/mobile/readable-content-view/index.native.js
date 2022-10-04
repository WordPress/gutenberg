/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { ALIGNMENT_BREAKPOINTS, WIDE_ALIGNMENTS } from '@wordpress/components';
/**
 * Internal dependencies
 */
import styles from './style.scss';

const PIXEL_RATIO = 2;

const ReadableContentView = ( { align, reversed, children, style } ) => {
	const { width, height } = Dimensions.get( 'window' );
	const [ windowWidth, setWindowWidth ] = useState( width );
	const [ windowRatio, setWindowRatio ] = useState( width / height );

	function onDimensionsChange( { window } ) {
		setWindowWidth( window.width );
		setWindowRatio( window.width / window.height );
	}

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onDimensionsChange
		);

		return () => {
			dimensionsChangeSubscription.remove();
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
			<View
				style={ [
					reversed
						? styles.reversedCenteredContent
						: styles.centeredContent,
					style,
					styles[ align ],
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
