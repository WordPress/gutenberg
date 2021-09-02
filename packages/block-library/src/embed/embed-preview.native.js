/**
 * External dependencies
 */
import { TouchableWithoutFeedback } from 'react-native';
import { isEmpty } from 'lodash';
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';

import { BlockCaption } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { memo, useState } from '@wordpress/element';
import { SandBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getPhotoHtml } from './util';
import EmbedNoPreview from './embed-no-preview';
import styles from './styles.scss';

const EmbedPreview = ( {
	align,
	className,
	clientId,
	icon,
	insertBlocksAfter,
	isSelected,
	label,
	onFocus,
	preview,
	previewable,
	type,
	url,
} ) => {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );

	const wrapperStyle = styles[ 'embed-preview__wrapper' ];
	const wrapperAlignStyle =
		styles[ `embed-preview__wrapper--align-${ align }` ];
	const sandboxAlignStyle =
		styles[ `embed-preview__sandbox--align-${ align }` ];

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

	const { provider_url: providerUrl } = preview;
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
	const sandboxClassnames = classnames(
		type,
		className,
		'wp-block-embed__wrapper'
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
					} }
				>
					<View
						pointerEvents="box-only"
						style={ [ wrapperStyle, wrapperAlignStyle ] }
					>
						<SandBox
							html={ html }
							title={ iframeTitle }
							type={ sandboxClassnames }
							providerUrl={ providerUrl }
							url={ url }
							containerStyle={ sandboxAlignStyle }
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
					onFocus={ onFocusCaption }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default memo( EmbedPreview );
