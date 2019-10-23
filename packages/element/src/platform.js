/**
 * Parts of this source were derived and modified from react-native-web,
 * released under the MIT license.
 *
 * Copyright (c) 2016-present, Nicolas Gallagher.
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const Platform = {
	OS: 'web',
	select: ( spec ) => ( 'web' in spec ? spec.web : spec.default ),
};
/**
 * Component used to detect the current Platform being used. Use Platform.OS === 'web' to detect if running on web enviroment.
 * This is the same concept as the React-Native implementation found here: https://facebook.github.io/react-native/docs/platform-specific-code#platform-module
 * Here is an example of how to use the select method
 * const placeholderLabel = Platform.select( {
 *   native: __( 'Add media' ),
 *   web: __( 'Drag images, upload new ones or select files from your library.' ),
 * } );
 */
export default Platform;
