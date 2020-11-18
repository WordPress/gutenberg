/**
 * External dependencies
 */
import { View, InteractionManager } from 'react-native';
/**
 * WordPress dependencies
 */
import { Picker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useRef, useEffect, useState } from '@wordpress/element';

const applyToAllImagesOption = {
	id: 'applyToAllImagesOption',
	label: __( 'Apply to all images' ),
	value: 'applyToAllImagesOption',
};

const options = [ applyToAllImagesOption ];

export default ( { applyImageOptions, cancelImageOptions, isVisible } ) => {
	const pickerRef = useRef();
	const [ apply, setApply ] = useState(false);

	useEffect( () => {
		InteractionManager.runAfterInteractions( () => {
			if ( isVisible && pickerRef.current ) {
				pickerRef.current.presentPicker();
			}
		} );
	}, [ isVisible ] );

	const onChange = ( value ) => {
		if ( value === applyToAllImagesOption.value ) {
			setApply(true);
		}
	};

	const onClose = () => {
		InteractionManager.runAfterInteractions( () => {
			this.onFinish()
		} );
	}

	onFinish = () => {
		if( apply ) {
			applyImageOptions();
		} else {
			cancelImageOptions();
		}
		setApply(false);
	}

	return (
		<Picker
			ref={ pickerRef }
			options={ options }
			onChange={ onChange }
			onClose={ onClose }
			leftAlign={ true }
			title={ __( 'Apply to all images in this gallery?' ) }
		/>
	);
};
