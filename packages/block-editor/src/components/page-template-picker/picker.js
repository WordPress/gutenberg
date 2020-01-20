/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import getDefaultTemplates from './default-templates';
import Preview from './preview';

const __experimentalPageTemplatePicker = ( { templates = getDefaultTemplates() } ) => {
	const [ templatePreview, setTemplatePreview ] = useState();

	return (
		<>
			<Container>
				{ templates.map( ( template ) => (
					<Button
						key={ template.name }
						icon={ template.icon }
						label={ template.name }
						onPress={ () => setTemplatePreview( template ) }
					/>
				) ) }
			</Container>
			<Preview
				template={ templatePreview }
				onDismiss={ () => setTemplatePreview( undefined ) }
			/>
		</>
	);
};

export default __experimentalPageTemplatePicker;
