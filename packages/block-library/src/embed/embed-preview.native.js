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

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const EmbedPreview = ( {
	isSelected,
	insertBlocksAfter,
	onBlur,
	onFocus,
	clientId,
} ) => {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );

	function accessibilityLabelCreator( caption ) {
		return isEmpty( caption )
			? /* translators: accessibility text. Empty Embed caption. */
			  __( 'Embed caption. Empty' )
			: sprintf(
					/* translators: accessibility text. %s: Embed caption. */
					__( 'Embed caption. %s' ),
					caption
			  );
	}

	function onEmbedPreviewPress() {
		setIsCaptionSelected( false );
	}

	function onFocusCaption() {
		if ( onFocus ) {
			onFocus();
		}
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
				<View style={ styles[ 'embed-preview__placeholder' ] }>
					<Text style={ styles[ 'embed-preview__placeholder-text' ] }>
						Embed Preview will be directly above the Block Caption
						component when it is implemented.
					</Text>
				</View>
				<BlockCaption
					accessible
					accessibilityLabelCreator={ accessibilityLabelCreator }
					clientId={ clientId }
					insertBlocksAfter={ insertBlocksAfter }
					isSelected={ isCaptionSelected }
					onFocus={ onFocusCaption }
					onBlur={ onBlur }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default EmbedPreview;
