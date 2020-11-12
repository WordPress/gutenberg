/**
 * External dependencies
 */
import { View, Text } from 'react-native';
import React from 'react';

/**
 * WordPress dependencies
 */
import {
	BlockIcon,
	MediaPlaceholder,
	MediaUploadProgress,
	RichText,
	PlainText,
} from '@wordpress/block-editor';
import { file as icon } from '@wordpress/icons';
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class FileEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isUploadInProgress: false,
		};

		this.onSelectFile = this.onSelectFile.bind( this );
		this.onChangeFileName = this.onChangeFileName.bind( this );
		this.onChangeDownloadButtonText = this.onChangeDownloadButtonText.bind(
			this
		);
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind(
			this
		);
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const { downloadButtonText } = attributes;

		if ( downloadButtonText === undefined || downloadButtonText === '' ) {
			setAttributes( {
				downloadButtonText: _x( 'Download', 'button label' ),
			} );
		}
	}

	onSelectFile( media ) {
		this.props.setAttributes( {
			href: media.url,
			fileName: media.title,
			textLinkHref: media.url,
			id: media.id,
		} );
	}

	onChangeFileName( fileName ) {
		this.props.setAttributes( { fileName } );
	}

	onChangeDownloadButtonText( downloadButtonText ) {
		this.props.setAttributes( { downloadButtonText } );
	}

	updateMediaProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;

		setAttributes( {
			href: payload.mediaUrl,
			id: payload.mediaServerId,
			textLinkHref: payload.mediaUrl,
		} );
		this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;

		setAttributes( { id: null, url: null } );
		this.setState( { isUploadInProgress: false } );
	}

	getErrorComponent( retryMessage ) {
		return (
			retryMessage && (
				<View style={ styles.retryContainer }>
					<Text style={ styles.uploadFailedText }>
						{ retryMessage }
					</Text>
				</View>
			)
		);
	}

	render() {
		const { attributes } = this.props;
		const { href, fileName, downloadButtonText, id } = attributes;

		if ( ! href ) {
			return (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'File' ),
						instructions: __( 'CHOOSE A FILE' ),
					} }
					onSelect={ this.onSelectFile }
					onFocus={ this.props.onFocus }
					allowedTypes={ [ 'other' ] }
				/>
			);
		}

		return (
			<MediaUploadProgress
				mediaId={ id }
				onUpdateMediaProgress={ this.updateMediaProgress }
				onFinishMediaUploadWithSuccess={
					this.finishMediaUploadWithSuccess
				}
				onFinishMediaUploadWithFailure={ () => {} }
				onMediaUploadStateReset={ this.mediaUploadStateReset }
				renderContent={ ( { isUploadFailed, retryMessage } ) => {
					if ( isUploadFailed ) {
						return this.getErrorComponent( retryMessage );
					}

					return (
						<View>
							<RichText
								__unstableMobileNoFocusOnMount
								fontSize={ 14 }
								onChange={ this.onChangeFileName }
								placeholder={ __( 'File name' ) }
								rootTagsToEliminate={ [ 'p' ] }
								tagName="p"
								underlineColorAndroid="transparent"
								value={ fileName }
								deleteEnter={ true }
							/>
							<View style={ styles.defaultButton }>
								<PlainText
									value={ downloadButtonText }
									onChange={ this.onChangeDownloadButtonText }
								/>
							</View>
						</View>
					);
				} }
			/>
		);
	}
}
