/**
 * External dependencies
 */
import { Platform as OriginalPlatform } from 'react-native';

const Platform = {
	...OriginalPlatform,
	select: ( spec ) => {
		if ( 'android' in spec ) {
			return spec.android;
		} else if ( 'native' in spec ) {
			return spec.native;
		}
		return spec.default;
	},
};

export default Platform;
