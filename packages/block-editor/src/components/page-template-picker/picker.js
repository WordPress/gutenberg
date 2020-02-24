/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
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
			blocks: parse( templatePreview.content ),
		} );
		setTemplatePreview( undefined );
		logUserEvent( userEvents.pageTemplateApplied, {
			template: templatePreview.name,
		} );
	};

	return (
		<>
			<Container>
				{ templates.map( ( template ) => (
					<Button
						key={ template.name }
						icon={ template.icon }
						label={ template.name }
						onPress={ () => {
							logUserEvent(
								userEvents.editorSessionTemplatePreview,
								{
									template: template.name,
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
