/**
 * External dependencies
 */
import { Platform as OriginalPlatform } from 'react-native';

const Platform = {
	...OriginalPlatform,
	select: ( spec ) => {
		if ( 'ios' in spec ) {
			return spec.ios;
		} else if ( 'native' in spec ) {
			return spec.native;
		}
		return spec.default;
	},
};

export default Platform;
