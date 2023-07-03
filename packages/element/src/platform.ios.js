/**
 * External dependencies
 */
import { Platform as OriginalPlatform } from 'react-native';

const Platform = {
	...OriginalPlatform,
	OS: 'native',
	select: ( spec ) => {
		if ( 'ios' in spec ) {
			return spec.ios;
		} else if ( 'native' in spec ) {
			return spec.native;
		}
		return spec.default;
	},
	isNative: true,
	isIOS: true,
};

export default Platform;
