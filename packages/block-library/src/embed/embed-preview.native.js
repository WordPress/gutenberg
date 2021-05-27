/**
 * External dependencies
 */
import { TouchableWithoutFeedback } from 'react-native';
import { isEmpty } from 'lodash';
import { WebView } from 'react-native-webview';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';

import { BlockCaption } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

const EmbedPreview = ( {
	isSelected,
	insertBlocksAfter,
	onBlur,
	clientId,
} ) => {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );

	function onEmbedPreviewPress() {
		setIsCaptionSelected( false );
	}

	function onFocusCaption() {
		if ( ! isCaptionSelected ) {
			setIsCaptionSelected( true );
		}
	}

	// Currently returning a Text component that act's as the Embed Preview to simulate the caption's isSelected state.
	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			onPress={ onEmbedPreviewPress }
			disabled={ ! isSelected }
		>
			<View>
				<View
					style={ {
						height: 200,
						width: '100%',
					} }
				>
					<WebView source={ { uri: 'https://reactnative.dev/' } } />
				</View>
				<BlockCaption
					accessible={ true }
					accessibilityLabelCreator={ ( caption ) =>
						isEmpty( caption )
							? /* translators: accessibility text. Empty Embed caption. */
							  __( 'Embed caption. Empty' )
							: sprintf(
									/* translators: accessibility text. %s: Embed caption. */
									__( 'Embed caption. %s' ),
									caption
							  )
					}
					clientId={ clientId }
					isSelected={ isCaptionSelected }
					onFocus={ onFocusCaption }
					onBlur={ onBlur }
					insertBlocksAfter={ insertBlocksAfter }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default EmbedPreview;
