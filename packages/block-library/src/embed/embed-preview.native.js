/**
 * External dependencies
 */
import { Alert, Linking, TouchableWithoutFeedback } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';

import { BlockCaption } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SandBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getPhotoHtml } from './util';
import EmbedNoPreview from './embed-no-preview';

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
	type,
	url,
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

	function openContentInBrowser() {
		Linking.canOpenURL( url )
			.then( ( supported ) => {
				if ( ! supported ) {
					Alert.alert(
						__( 'Problem opening the embedded content' ),
						__(
							'No application can handle this request. Please install a Web browser.'
						)
					);
					// eslint-disable-next-line no-console
					console.warn(
						'No application found that can open the video with URL: ' +
							url
					);
				} else {
					return Linking.openURL( url );
				}
			} )
			.catch( ( err ) => {
				Alert.alert(
					__( 'Problem opening the embedded content' ),
					__( 'An unknown error occurred. Please try again.' )
				);
				// eslint-disable-next-line no-console
				console.error(
					'An error occurred while opening the embed URL: ' + url,
					err
				);
			} );
	}

	const { scripts, provider_url: providerUrl } = preview;
	const html = 'photo' === type ? getPhotoHtml( preview ) : preview.html;
	const parsedHost = new URL( url ).host.split( '.' );
	const parsedHostBaseUrl = parsedHost
		.splice( parsedHost.length - 2, parsedHost.length - 1 )
		.join( '.' );
	const iframeTitle = sprintf(
		// translators: %s: host providing embed content e.g: www.youtube.com
		__( 'Embedded content from %s' ),
		parsedHostBaseUrl
	);

	const embedWrapper =
		/* We should render here: <WpEmbedPreview html={ html } /> */
		'wp-embed' === type ? null : (
			<>
				<TouchableWithoutFeedback
					onPress={ () => {
						if ( onFocus ) {
							onFocus();
						}
						if ( isCaptionSelected ) {
							setIsCaptionSelected( false );
						}
						if ( isSelected ) {
							// TODO: Request confirmation from user before opening the content.
							openContentInBrowser();
						}
					} }
				>
					<View pointerEvents="box-only">
						<SandBox
							html={ html }
							scripts={ scripts }
							title={ iframeTitle }
							providerUrl={ providerUrl }
							// type={ sandboxClassnames }
						/>
					</View>
				</TouchableWithoutFeedback>
			</>
		);

	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			onPress={ onEmbedPreviewPress }
			disabled={ ! isSelected }
		>
			<View>
				{ previewable ? (
					embedWrapper
				) : (
					<EmbedNoPreview
						label={ label }
						icon={ icon }
						isSelected={ isSelected }
						onPress={ () => setIsCaptionSelected( false ) }
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
