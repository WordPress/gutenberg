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
	icon,
	insertBlocksAfter,
	isSelected,
	label,
	onBlur,
	onFocus,
	preview,
} ) => {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );
	const containerStyle = usePreferredColorSchemeStyle(
		styles.embed__container,
		styles[ 'embed__container--dark' ]
	);
	const labelStyle = usePreferredColorSchemeStyle(
		styles.embed__label,
		styles[ 'embed__label--dark' ]
	);
	const placeholderTextStyle = usePreferredColorSchemeStyle(
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
				<View style={ containerStyle }>
					<View style={ styles.embed__icon }>{ icon }</View>
					<Text style={ labelStyle }>{ label }</Text>
					<Text style={ placeholderTextStyle }>{ preview }</Text>
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
