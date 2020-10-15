/**
 * External dependencies
 */
import { View } from 'react-native';
import React from 'react';

/**
 * WordPress dependencies
 */
import {
	BlockIcon,
	MediaPlaceholder,
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
		this.onSelectFile = this.onSelectFile.bind( this );
		this.onChangeFileName = this.onChangeFileName.bind( this );
		this.onChangeDownloadButtonText = this.onChangeDownloadButtonText.bind(
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

	render() {
		const { attributes } = this.props;
		const { href, fileName, downloadButtonText } = attributes;

		if ( ! href ) {
			return (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'File' ),
						instructions: __( 'PICK A FILE' ),
					} }
					onSelect={ this.onSelectFile }
					onFocus={ this.props.onFocus }
					allowedTypes={ [ 'other' ] }
					accept="*"
				/>
			);
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
	}
}
