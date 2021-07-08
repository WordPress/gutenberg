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
	icon,
	insertBlocksAfter,
	isSelected,
	label,
	onBlur,
	onFocus,
	preview,
	previewable,
	url,
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

	const parsedHost = new URL( url ).host.split( '.' );
	const parsedHostBaseUrl = parsedHost
		.splice( parsedHost.length - 2, parsedHost.length - 1 )
		.join( '.' );

	const cannotShowThumbnail =
		! previewable ||
		! preview ||
		! preview.thumbnail_url?.length ||
		! preview.height ||
		! preview.width;

	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			onPress={ onEmbedPreviewPress }
			disabled={ ! isSelected }
		>
			<View>
				{ cannotShowThumbnail ? (
					<View style={ containerStyle }>
						<View style={ styles.embed__icon }>{ icon }</View>
						<Text style={ labelStyle }>{ label }</Text>
						<Text style={ placeholderTextStyle }>
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
							flex: 1,
							aspectRatio: preview.width / preview.height,
						} }
						source={ {
							uri: preview.thumbnail_url,
						} }
						resizeMode="cover"
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
