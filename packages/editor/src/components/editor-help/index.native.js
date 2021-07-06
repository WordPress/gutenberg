/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

export default function EditorHelpTopics( { isVisible, onClose } ) {
	return useMemo( () => (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			title={ __( 'How to edit your site' ) }
		>
			<View>
				<Text>TODO AMANDA!!</Text>
			</View>
		</BottomSheet>
	) );
}
