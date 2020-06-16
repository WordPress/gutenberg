/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Tooltip from './tooltip';

/**
 * External dependencies
 */
import {
	logUserEvent,
	userEvents,
	requestStarterPageTemplatesTooltipShown,
	setStarterPageTemplatesTooltipShown,
} from '@wordpress/react-native-bridge';
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
	const [ tooltipVisible, setTooltipVisible ] = useState( false );
	const contentOpacity = useRef( new Animated.Value( 0 ) ).current;

	useEffect( () => {
		if ( shouldShowPicker() && visible && ! pickerVisible ) {
			setPickerVisible( true );
		}

		startPickerAnimation( visible );
		shouldShowTooltip();

		Keyboard.addListener( 'keyboardDidShow', onKeyboardDidShow );
		Keyboard.addListener( 'keyboardDidHide', onKeyboardDidHide );

		return () => {
			Keyboard.removeListener( 'keyboardDidShow', onKeyboardDidShow );
			Keyboard.removeListener( 'keyboardDidHide', onKeyboardDidHide );
		};
	}, [ visible ] );

	useEffect( () => {
		if ( tooltipVisible && templatePreview ) {
			setTooltipVisible( false );
		}
	}, [ templatePreview ] );

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

	const shouldShowTooltip = () => {
		requestStarterPageTemplatesTooltipShown( ( tooltipShown ) => {
			if ( ! tooltipShown ) {
				setTooltipVisible( true );
				setStarterPageTemplatesTooltipShown( true );
			}
		} );
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

	const onTooltipHidden = () => {
		setTooltipVisible( false );
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
			{ tooltipVisible && (
				<Tooltip onTooltipHidden={ onTooltipHidden } />
			) }
			<Container>
				{ templates.map( ( template ) => (
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
			</Container>
			<Preview
				template={ templatePreview }
				onDismiss={ () => setTemplatePreview( undefined ) }
				onApply={ onApply }
			/>
		</Animated.View>
	);
};

export default __experimentalPageTemplatePicker;
