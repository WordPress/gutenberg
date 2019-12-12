/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import __experimentalBlockListFooter from '../block-list-footer';
import Button from './button';
import Container from './container';
import defaultTemplates from './default-templates';
import Preview from './preview';

const __experimentalPageTemplatePicker = ( { templates = defaultTemplates, resetContent } ) => {
	const [ templatePreview, setTemplatePreview ] = useState();

	return (
		<__experimentalBlockListFooter>
			<Container style={ { flexDirection: 'row' } }>
				{ templates.map( ( { name, content } ) => (
					<Button
						key={ name }
						onPress={ () => setTemplatePreview( content ) }
						label={ name }
					/>
				) ) }
			</Container>
			<Preview
				content={ templatePreview }
				onDismiss={ () => setTemplatePreview( undefined ) }
			/>
		</__experimentalBlockListFooter>
	);
};

export default __experimentalPageTemplatePicker;
