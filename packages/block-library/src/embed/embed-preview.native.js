/**
 * External dependencies
 */
import { TouchableWithoutFeedback, Text } from 'react-native';
import { isEmpty } from 'lodash';

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
				<Text style={ { color: 'blue', fontSize: 12 } }>
					Embed Preview will be directly above the Block Caption
					component when it is implemented.
				</Text>
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
