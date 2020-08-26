/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const PIXEL_RATIO = 2;

const BREAKPOINTS = {
	wide: 1024,
	big: 820,
	medium: 768,
};

const ReadableContentView = ( { align, reversed, children, style } ) => {
	const [ windowWidth, setWindowWidth ] = useState(
		Dimensions.get( 'window' ).width
	);
	const [ windowRatio, setWindowRatio ] = useState(
		Dimensions.get( 'window' ).width / Dimensions.get( 'window' ).height
	);

	function onDimensionsChange( { window } ) {
		setWindowWidth( window.width );
		setWindowRatio( window.width / window.height );
	}

	useEffect( () => {
		if ( align === 'wide' ) {
			Dimensions.addEventListener( 'change', onDimensionsChange );
		}

		return () => {
			if ( align === 'wide' ) {
				Dimensions.removeEventListener( 'change', onDimensionsChange );
			}
		};
	}, [ align ] );

	function getWideStyles() {
		if ( windowRatio >= PIXEL_RATIO && windowWidth < BREAKPOINTS.big ) {
			return styles.wideLandscape;
		}

		if (
			windowWidth >= BREAKPOINTS.medium &&
			windowWidth < BREAKPOINTS.wide
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
					align === 'wide' && getWideStyles(),
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
