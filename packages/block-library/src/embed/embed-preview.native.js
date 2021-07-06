/**
 * External dependencies
 */
import { TouchableWithoutFeedback, Image, Text } from 'react-native';
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
	previewable,
	url,
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

	const parsedHost = new URL( url ).host.split( '.' );
	const parsedHostBaseUrl = parsedHost
		.splice( parsedHost.length - 2, parsedHost.length - 1 )
		.join( '.' );

	const cannotShowThumbnail =
		! previewable ||
		! preview ||
		! preview.thumbnail_url?.length ||
		! preview.height;

	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			onPress={ onEmbedPreviewPress }
			disabled={ ! isSelected }
		>
			<View>
				{ cannotShowThumbnail ? (
					<View style={ stylePlaceholder }>
						<Text style={ stylePlaceholderText }>
							{ sprintf(
								/* translators: %s: host providing embed content e.g: www.youtube.com */
								__(
									"Embedded content from %s can't be viewed in the mobile editor at the moment. Please preview the page to see the embedded content."
								),
								parsedHostBaseUrl
							) }
						</Text>
					</View>
				) : (
					<Image
						style={ {
							height: preview.height,
							width: '100%',
						} }
						source={ {
							uri: preview.thumbnail_url,
						} }
						resizeMode="contain"
					/>
				) }
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
