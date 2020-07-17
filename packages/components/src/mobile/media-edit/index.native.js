/**
 * External dependencies
 */
import React from 'react';
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';
import {
	requestMediaEditor,
	mediaSources,
} from '@wordpress/react-native-bridge';

export const MEDIA_TYPE_IMAGE = 'image';

export const MEDIA_EDITOR = 'MEDIA_EDITOR';

const editOption = {
	id: MEDIA_EDITOR,
	value: MEDIA_EDITOR,
	label: __( 'Edit' ),
	types: [ MEDIA_TYPE_IMAGE ],
};

const replaceOption = {
	id: mediaSources.deviceLibrary,
	value: mediaSources.deviceLibrary,
	label: __( 'Replace' ),
	types: [ MEDIA_TYPE_IMAGE ],
};

const removeOption = {
	id: 'removeOption',
	label: __( 'Remove' ),
	value: 'removeOption',
	separated: true,
};

export class MediaEdit extends React.Component {
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );
		this.getMediaOptionsItems = this.getMediaOptionsItems.bind( this );
	}

	getMediaOptionsItems() {
		const { onRemove } = this.props;

		return compact( [
			editOption,
			replaceOption,
			onRemove && removeOption,
		] );
	}

	onPickerPresent() {
		if ( this.picker ) {
			this.picker.presentPicker();
		}
	}

	onPickerSelect( value ) {
		const { onSelect, onRemove, multiple = false } = this.props;

		switch ( value ) {
			case MEDIA_EDITOR:
				requestMediaEditor( this.props.source.uri, ( media ) => {
					if ( ( multiple && media ) || ( media && media.id ) ) {
						onSelect( media );
					}
				} );
				break;
			case removeOption.value:
				onRemove();
				break;
			default:
				this.props.openReplaceMediaOptions();
		}
	}

	render() {
		const { onRemove } = this.props;
		const options = this.getMediaOptionsItems();

		const mediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => ( this.picker = instance ) }
				options={ this.getMediaOptionsItems() }
				leftAlign={ true }
				onChange={ this.onPickerSelect }
				// translators: %s: block title e.g: "Paragraph".
				title={ __( 'Media options' ) }
				destructiveButtonIndex={ onRemove && options.length }
			/>
		);

		return this.props.render( {
			open: this.onPickerPresent,
			mediaOptions,
		} );
	}
}

export default MediaEdit;
