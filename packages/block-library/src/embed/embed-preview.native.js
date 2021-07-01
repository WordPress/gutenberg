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
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const EmbedPreview = ( {
	clientId,
	insertBlocksAfter,
	isSelected,
	onBlur,
	onFocus,
	preview,
} ) => {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );
	const stylePlaceholder = usePreferredColorSchemeStyle(
		styles[ 'embed-preview__placeholder' ],
		styles[ 'embed-preview__placeholder--dark' ]
	);
	const stylePlaceholderText = usePreferredColorSchemeStyle(
		styles[ 'embed-preview__placeholder-text' ],
		styles[ 'embed-preview__placeholder-text--dark' ]
	);

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
				<View style={ stylePlaceholder }>
					<Text style={ stylePlaceholderText }>{ preview }</Text>
				</View>
				<BlockCaption
					accessibilityLabelCreator={ accessibilityLabelCreator }
					accessible
					clientId={ clientId }
					insertBlocksAfter={ insertBlocksAfter }
					isSelected={ isCaptionSelected }
					onBlur={ onBlur }
					onFocus={ onFocusCaption }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default EmbedPreview;
