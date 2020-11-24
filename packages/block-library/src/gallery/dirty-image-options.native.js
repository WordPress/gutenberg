/**
 * External dependencies
 */
import { InteractionManager } from 'react-native';
/**
 * WordPress dependencies
 */
import { Picker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useRef, useEffect, useState, Platform } from '@wordpress/element';

const applyToAllImagesOption = {
	id: 'applyToAllImagesOption',
	label: __( 'Apply to all images' ),
	value: 'applyToAllImagesOption',
};

const options = [ applyToAllImagesOption ];

const isIOS = Platform.OS === 'ios';

export default ( { applyImageOptions, cancelImageOptions, isVisible } ) => {
	const pickerRef = useRef();
	const [ apply, setApply ] = useState( false );
	useEffect( () => {
		InteractionManager.runAfterInteractions( () => {
			if ( isVisible && pickerRef.current ) {
				pickerRef.current.presentPicker();
			}
		} );
	}, [ isVisible ] );

	const onChange = ( value ) => {
		if ( value === applyToAllImagesOption.value ) {
			if ( isIOS ) {
				applyImageOptions();
			} else {
				setApply( true );
			}
		}
	};

	const onClose = () => {
		if ( ! isIOS ) {
			InteractionManager.runAfterInteractions( () => {
				onFinish();
			} );
		}
	};

	const onFinish = () => {
		if ( apply ) {
			applyImageOptions();
		} else {
			cancelImageOptions();
		}
		setApply( false );
	};

	return (
		<Picker
			ref={ pickerRef }
			options={ options }
			onChange={ onChange }
			onCancel={ isIOS && cancelImageOptions }
			onClose={ onClose }
			leftAlign={ true }
			title={ __( 'Apply to all images in this gallery?' ) }
		/>
	);
};
