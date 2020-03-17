/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { logUserEvent, userEvents } from 'react-native-gutenberg-bridge';
import { Animated } from 'react-native';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import getDefaultTemplates from './default-templates';
import Preview from './preview';

const PICKER_ANIMATION_DELAY = 500;

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
	const contentOpacity = new Animated.Value( 1 );

	useEffect( () => {
		if ( ! visible ) {
			onHidePicker();
		} else {
			setPickerVisible( true );
		}
	}, [ visible ] );

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

	const onHidePicker = () => {
		Animated.timing( contentOpacity, {
			toValue: 0,
			duration: 300,
			delay: PICKER_ANIMATION_DELAY,
		} ).start( () => {
			setPickerVisible( false );
		} );
	};

	if ( ! pickerVisible ) {
		return null;
	}

	return (
		<Animated.View style={ [ { opacity: contentOpacity } ] }>
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
