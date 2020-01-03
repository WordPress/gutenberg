/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import getDefaultTemplates from './default-templates';
import Preview from './preview';

const __experimentalPageTemplatePicker = ( { setLayout, templates = getDefaultTemplates() } ) => {
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
				onApply={ () => {
					setLayout( templatePreview );
					setTemplatePreview( undefined );
				} }
			/>
		</>
	);
};

export default withDispatch( ( dispatch ) => {
	const {
		editPost,
		resetEditorBlocks,
	} = dispatch( 'core/editor' );

	return {
		setLayout: ( layout ) => {
			const blocks = parse( layout.content );
			editPost( { title: layout.name } );
			resetEditorBlocks( blocks );
		},
	};
} )( __experimentalPageTemplatePicker );
