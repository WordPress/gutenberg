/**
 * External dependencies
 */
import React from 'react';
import {
	requestMediaPicker,
	mediaSources,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';

export const MEDIA_TYPE_IMAGE = 'image';

const editOption = {
	id: mediaSources.mediaEditor,
	value: mediaSources.mediaEditor,
	label: __( 'Edit' ),
	types: [ MEDIA_TYPE_IMAGE ],
	icon: 'admin-appearance',
};

const replaceOption = {
	id: mediaSources.deviceLibrary,
	value: mediaSources.deviceLibrary,
	label: __( 'Replace' ),
	types: [ MEDIA_TYPE_IMAGE ],
	icon: 'update',
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
		const { allowedTypes = [], onSelect, multiple = false } = this.props;
		const mediaSource = this.getMediaOptionsItems().filter( ( source ) => source.value === value ).shift();
		const types = allowedTypes.filter( ( type ) => mediaSource.types.includes( type ) );
		requestMediaPicker( mediaSource.id, types, multiple, ( media ) => {
			if ( ( multiple && media ) || ( media && media.id ) ) {
				onSelect( media );
			}
		} );
	}

	render() {
		const mediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => this.picker = instance }
				options={ this.getMediaOptionsItems() }
				onChange={ this.onPickerSelect }
			/>
		);

		return this.props.render( { open: this.onPickerPresent, mediaOptions } );
	}
}

export default MediaEdit;
