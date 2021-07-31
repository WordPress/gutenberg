/**
 * External dependencies
 */
import { Text, Image } from 'react-native';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export const HelpDetailBodyText = ( { text } ) => {
	return <Text style={ styles.helpDetailBody }>{ text }</Text>;
};

export const HelpDetailSectionHeadingText = ( { text } ) => {
	return <Text style={ styles.helpDetailSectionHeading }>{ text }</Text>;
};

export const HelpDetailImage = ( { source } ) => {
	return useMemo(
		() => <Image source={ source } style={ styles.helpDetailImage } />,
		[ source ]
	);
};
