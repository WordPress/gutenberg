/**
 * External dependencies
 */
import { TouchableWithoutFeedback, Image } from 'react-native';
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
import EmbedNoPreview from './embed-no-preview';
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
					<EmbedNoPreview
						label={ label }
						icon={ icon }
						isSelected={ isSelected }
						onPress={ () => setIsCaptionSelected( false ) }
					/>
				) : (
					<Image
						style={ [
							styles[ 'embed-preview__image' ],
							{ aspectRatio: preview.width / preview.height },
						] }
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
