/**
 * External dependencies
 */
import React from 'react';
import {
	requestMediaEditor,
	mediaSources,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';
import { update } from '@wordpress/icons';

export const MEDIA_TYPE_IMAGE = 'image';

export const MEDIA_EDITOR = 'MEDIA_EDITOR';

const editOption = {
	id: MEDIA_EDITOR,
	value: MEDIA_EDITOR,
	label: __( 'Edit' ),
	types: [ MEDIA_TYPE_IMAGE ],
	icon: 'admin-appearance',
};

const replaceOption = {
	id: mediaSources.deviceLibrary,
	value: mediaSources.deviceLibrary,
	label: __( 'Replace' ),
	types: [ MEDIA_TYPE_IMAGE ],
	icon: update,
};

const options = [ editOption, replaceOption ];

export class MediaEdit extends React.Component {
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );
	}

	getMediaOptionsItems() {
		return options;
	}

	onPickerPresent() {
		if ( this.picker ) {
			this.picker.presentPicker();
		}
	}

	onPickerSelect( value ) {
		const { onSelect, multiple = false } = this.props;

		switch ( value ) {
			case MEDIA_EDITOR:
				requestMediaEditor( this.props.source.uri, ( media ) => {
					if ( ( multiple && media ) || ( media && media.id ) ) {
						onSelect( media );
					}
				} );
				break;
			default:
				this.props.openReplaceMediaOptions();
		}
	}

	render() {
		const mediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => ( this.picker = instance ) }
				options={ this.getMediaOptionsItems() }
				onChange={ this.onPickerSelect }
			/>
		);

		return this.props.render( {
			open: this.onPickerPresent,
			mediaOptions,
		} );
	}
}

export default MediaEdit;
