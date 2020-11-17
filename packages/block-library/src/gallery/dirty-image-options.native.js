/**
 * External dependencies
 */
import { View, InteractionManager } from 'react-native';
/**
 * WordPress dependencies
 */
import { Picker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useRef, useEffect } from '@wordpress/element';

const applyToAllImagesOption = {
	id: 'applyToAllImagesOption',
	label: __( 'Apply to all images' ),
	value: 'applyToAllImagesOption',
};

const options = [ applyToAllImagesOption ];

export default ( { applyImageOptions, cancelImageOptions, isVisible } ) => {
	const pickerRef = useRef();
	useEffect( () => {
		InteractionManager.runAfterInteractions( () => {
			if ( isVisible && pickerRef.current ) {
				pickerRef.current.presentPicker();
			}
		} );
	}, [ isVisible ] );

	const onChange = ( value ) => {
		if ( value === applyToAllImagesOption.value ) {
			applyImageOptions();
		}
	};
	return (
		<Picker
			ref={ pickerRef }
			options={ options }
			onChange={ onChange }
			onCancel={ cancelImageOptions }
			leftAlign={ true }
			title={ __( 'Gallery block options' ) }
		/>
	);
};
