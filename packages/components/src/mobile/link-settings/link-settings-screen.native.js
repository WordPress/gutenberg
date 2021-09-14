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
	const { imageUrl, attachmentPageUrl, setAttributes, url = '' } = props;
	const { inputValue = url } = route.params || {};

	const onLinkCellPressed = () => {
		if ( props.precursorScreenName ) {
			// TODO(David): Passing `setAttributes` throws a warning, we should avoid
			// passing it here. Additionally, `imageUrl` and `attachmentPage` are very
			// specific to this specific Image use case, can we relocate it into
			// `image/edit` with a callback instead of a screen name string?
			navigation.navigate( props.precursorScreenName, {
				inputValue,
				setAttributes,
				imageUrl,
				attachmentPageUrl,
			} );
		} else {
			navigation.navigate( 'linkPicker', { inputValue } );
		}
	};

	return useMemo( () => {
		return (
			<LinkSettings
				onLinkCellPressed={
					props.hasPicker ? onLinkCellPressed : undefined
				}
				urlValue={ inputValue }
				{ ...props }
			/>
		);
	}, [ props, inputValue, navigation, route ] );
};

export default LinkSettingsScreen;
