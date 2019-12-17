/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import getDefaultTemplates from './default-templates';
import Preview from './preview';

const __experimentalPageTemplatePicker = ( { templates = getDefaultTemplates(), resetContent } ) => {
	const [ templatePreview, setTemplatePreview ] = useState();

	return (
		<>
			<Container style={ { flexDirection: 'row' } }>
				{ templates.map( ( template ) => (
					<Button
						key={ template.name }
						onPress={ () => setTemplatePreview( template ) }
						label={ template.name }
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
