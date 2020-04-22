/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { MenuBottomSheet } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { logUserEvent, userEvents } from 'react-native-gutenberg-bridge';
import { Animated, Dimensions, Keyboard } from 'react-native';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import getDefaultTemplates from './default-templates';
import Preview from './preview';

// Used to hide the picker if there's no enough space in the window
const PICKER_HEIGHT_OFFSET = 150;

function getTemplatesForMenu( templates ) {
	return templates.map( ( template ) => ( {
		...template,
		title: template.name,
	} ) );
}

const __experimentalPageTemplatePicker = ( {
	templates = getDefaultTemplates(),
	visible,
} ) => {
	const { editPost } = useDispatch( 'core/editor' );
	const { title } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );

		return {
			title: getEditedPostAttribute( 'title' ),
		};
	} );

	const [ templatePreview, setTemplatePreview ] = useState();
	const [ pickerVisible, setPickerVisible ] = useState( visible );
	const [ bottomPickerVisible, setBottomPickerVisible ] = useState();
	const contentOpacity = useRef( new Animated.Value( 0 ) ).current;
	const timerRef = useRef( null );

	useEffect( () => {
		if ( shouldShowPicker() && visible && ! pickerVisible ) {
			setPickerVisible( true );
		}
		startPickerAnimation( visible );

		Keyboard.addListener( 'keyboardDidShow', onKeyboardDidShow );
		Keyboard.addListener( 'keyboardDidHide', onKeyboardDidHide );

		return () => {
			Keyboard.removeListener( 'keyboardDidShow', onKeyboardDidShow );
			Keyboard.removeListener( 'keyboardDidHide', onKeyboardDidHide );
			clearTimeout( timerRef.current );
		};
	}, [ visible ] );

	const onKeyboardDidShow = () => {
		if ( visible ) {
			startPickerAnimation( shouldShowPicker() );
		}
	};

	const onKeyboardDidHide = () => {
		if ( visible ) {
			setPickerVisible( true );
			startPickerAnimation( true );
		}
	};

	const shouldShowPicker = () => {
		// On smaller devices on landscape we hide the picker
		// so it doesn't overlap with the editor's content
		const windowHeight = Dimensions.get( 'window' ).height;
		return PICKER_HEIGHT_OFFSET < windowHeight / 3;
	};

	const onApply = () => {
		editPost( {
			title: title || templatePreview.name,
			blocks: templatePreview.blocks,
		} );
		logUserEvent( userEvents.editorSessionTemplateApply, {
			template: templatePreview.key,
		} );
		setTemplatePreview( undefined );
	};

	const onPressMore = () => {
		setBottomPickerVisible( true );
	};

	const onCloseBottomPicker = () => {
		setBottomPickerVisible( false );
	};

	const onPressTemplate = ( template ) => {
		onCloseBottomPicker();

		if ( timerRef.current ) {
			clearTimeout( timerRef.current );
		}

		// Timer needed since we can't have two modals
		// opened at the same time
		timerRef.current = setTimeout( () => {
			setTemplatePreview( template );
		}, 350 );
	};

	const startPickerAnimation = ( isVisible ) => {
		Animated.timing( contentOpacity, {
			toValue: isVisible ? 1 : 0,
			duration: 300,
			useNativeDriver: true,
		} ).start( () => {
			if ( ! isVisible ) {
				setPickerVisible( isVisible );
			}
		} );
	};

	if ( ! pickerVisible ) {
		return null;
	}

	return (
		<Animated.View style={ [ { opacity: contentOpacity } ] }>
			<Container>
				{ templates.slice( 0, 4 ).map( ( template ) => (
					<Button
						key={ template.key }
						icon={ template.icon }
						label={ template.name }
						onPress={ () => {
							logUserEvent(
								userEvents.editorSessionTemplatePreview,
								{
									template: template.key,
								}
							);
							setTemplatePreview( template );
						} }
					/>
				) ) }
				<Button
					icon="..."
					isMoreOption={ true }
					label={ __( 'More' ) }
					onPress={ onPressMore }
				/>
			</Container>
			<MenuBottomSheet
				isVisible={ bottomPickerVisible }
				items={ getTemplatesForMenu( templates ) }
				onClose={ onCloseBottomPicker }
				onSelect={ onPressTemplate }
				title={ __( 'Templates' ) }
			/>
			<Preview
				template={ templatePreview }
				onDismiss={ () => setTemplatePreview( undefined ) }
				onApply={ onApply }
			/>
		</Animated.View>
	);
};

export default __experimentalPageTemplatePicker;
