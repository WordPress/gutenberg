/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { logUserEvent, userEvents } from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import getDefaultTemplates from './default-templates';
import Preview from './preview';

const __experimentalPageTemplatePicker = ( {
	templates = getDefaultTemplates(),
} ) => {
	const { editPost } = useDispatch( 'core/editor' );
	const [ templatePreview, setTemplatePreview ] = useState();

	const onApply = () => {
		editPost( {
			title: templatePreview.name,
			blocks: templatePreview.blocks,
		} );
		logUserEvent( userEvents.editorSessionTemplateApply, {
			template: templatePreview.key,
		} );
		setTemplatePreview( undefined );
	};

	return (
		<>
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
		</>
	);
};

export default __experimentalPageTemplatePicker;
