/**
 * External dependencies
 */
import { Text, Image, View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	usePreferredColorScheme,
	usePreferredColorSchemeStyle,
} from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const HelpDetailBodyText = ( { text } ) => {
	const bodyStyle = usePreferredColorSchemeStyle(
		styles.helpDetailBody,
		styles.helpDetailBodyDark
	);
	return (
		<Text selectable style={ bodyStyle }>
			{ text }
		</Text>
	);
};

export const HelpDetailSectionHeadingText = ( { text, badge } ) => {
	const headingTextStyle = usePreferredColorSchemeStyle(
		styles.helpDetailSectionHeadingText,
		styles.helpDetailSectionHeadingTextDark
	);
	return (
		<View style={ styles.helpDetailSectionHeading }>
			{ badge && <HelpDetailBadge text={ badge } /> }
			<Text
				accessibilityRole="header"
				selectable
				style={ headingTextStyle }
			>
				{ text }
			</Text>
		</View>
	);
};

export const HelpDetailImage = ( {
	accessible,
	accessibilityLabel,
	source,
	sourceDarkMode,
} ) => {
	const getUri = () => {
		const sourceFromScheme =
			darkModeEnabled && sourceDarkMode ? sourceDarkMode : source;

		// TODO: Find an image CDN instead of GitHub
		const sourcePrefix =
			'https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/editor/src/components/editor-help/images/';
		const sourceSuffix = '.png';

		return `${ sourcePrefix }${ sourceFromScheme }${ sourceSuffix }`;
	};

	const [ imageSize, setImageSize ] = useState( {
		width: 0,
		height: 0,
	} );

	useEffect( () => {
		Image.getSize( getUri(), ( width, height ) => {
			setImageSize( { width, height } );
		} );
	}, [ source, sourceDarkMode, getUri ] );

	const darkModeEnabled = usePreferredColorScheme() === 'dark';

	return (
		<Image
			accessible={ accessible }
			accessibilityLabel={ accessibilityLabel }
			resizeMode="contain"
			source={ {
				uri: getUri(),
			} }
			// TODO: fix aspect ratio
			style={ { width: imageSize.width, height: imageSize.height } }
		/>
	);
};

const HelpDetailBadge = ( { text } ) => {
	return (
		<View style={ styles.helpDetailBadgeContainer }>
			<Text style={ styles.helpDetailBadgeText }>{ text }</Text>
		</View>
	);
};
