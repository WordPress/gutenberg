/**
 * External dependencies
 */
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LinkSettings from './';

const LinkSettingsScreen = ( props ) => {
	const navigation = useNavigation();
	const route = useRoute();
	const { url = '' } = props;
	const { inputValue = url } = route.params || {};

	const onLinkCellPressed = () => {
		if ( props.onLinkCellPressed ) {
			props.onLinkCellPressed( { navigation } );
		} else {
			navigation.navigate( 'linkPicker', { inputValue } );
		}
	};

	return useMemo( () => {
		return (
			<LinkSettings
				{ ...props }
				onLinkCellPressed={
					props.hasPicker ? onLinkCellPressed : undefined
				}
				urlValue={ inputValue }
			/>
		);
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ props, inputValue, navigation, route ] );
};

export default LinkSettingsScreen;
