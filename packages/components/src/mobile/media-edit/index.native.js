/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	requestMediaEditor,
	mediaSources,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import Picker from '../picker';

export const MEDIA_TYPE_IMAGE = 'image';

export const MEDIA_EDITOR = 'MEDIA_EDITOR';

const editOption = {
	id: MEDIA_EDITOR,
	value: MEDIA_EDITOR,
	label: __( 'Edit' ),
	requiresModal: true,
	types: [ MEDIA_TYPE_IMAGE ],
};

const replaceOption = {
	id: mediaSources.deviceLibrary,
	value: mediaSources.deviceLibrary,
	label: __( 'Replace' ),
	types: [ MEDIA_TYPE_IMAGE ],
};

export class MediaEdit extends Component {
	constructor( props ) {
		super( props );
		this.onPickerPresent = this.onPickerPresent.bind( this );
		this.onPickerSelect = this.onPickerSelect.bind( this );
		this.getMediaOptionsItems = this.getMediaOptionsItems.bind( this );
		this.getDestructiveButtonIndex =
			this.getDestructiveButtonIndex.bind( this );
	}

	getMediaOptionsItems() {
		const { pickerOptions, openReplaceMediaOptions, source } = this.props;

		return [
			source?.uri && editOption,
			openReplaceMediaOptions && replaceOption,
			...( pickerOptions ? pickerOptions : [] ),
		].filter( Boolean );
	}

	getDestructiveButtonIndex() {
		const options = this.getMediaOptionsItems();
		const destructiveButtonIndex = options.findIndex(
			( option ) => option?.destructiveButton
		);

		return destructiveButtonIndex !== -1
			? destructiveButtonIndex + 1
			: undefined;
	}

	onPickerPresent() {
		if ( this.picker ) {
			this.picker.presentPicker();
		}
	}

	onPickerSelect( value ) {
		const {
			onSelect,
			pickerOptions,
			multiple = false,
			openReplaceMediaOptions,
		} = this.props;

		switch ( value ) {
			case MEDIA_EDITOR:
				requestMediaEditor( this.props.source.uri, ( media ) => {
					if ( ( multiple && media ) || ( media && media.id ) ) {
						onSelect( media );
					}
				} );
				break;
			default:
				const optionSelected =
					pickerOptions &&
					pickerOptions.find( ( option ) => option.id === value );

				if ( optionSelected && optionSelected.onPress ) {
					optionSelected.onPress();
					return;
				}

				if ( openReplaceMediaOptions ) {
					openReplaceMediaOptions();
				}
		}
	}

	render() {
		const mediaOptions = () => (
			<Picker
				hideCancelButton
				ref={ ( instance ) => ( this.picker = instance ) }
				options={ this.getMediaOptionsItems() }
				leftAlign
				onChange={ this.onPickerSelect }
				// translators: %s: block title e.g: "Paragraph".
				title={ __( 'Media options' ) }
				destructiveButtonIndex={ this.getDestructiveButtonIndex() }
			/>
		);

		return this.props.render( {
			open: this.onPickerPresent,
			mediaOptions,
		} );
	}
}

export default MediaEdit;
