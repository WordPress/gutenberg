/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Button from './button';
import Container from './container';
import defaultTemplates from './default-templates';

const __experimentalPageTemplatePicker = ( { templates = defaultTemplates, resetContent } ) => {
	return (
		<Container>
			{ templates.map( ( { name, content, icon } ) => (
				<Button
					icon={ icon }
					key={ name }
					label={ name }
					onPress={ () => resetContent( content ) }
				/>
			) ) }
		</Container>
	);
};

export default withDispatch( ( dispatch ) => {
	const {
		resetEditorBlocks,
	} = dispatch( 'core/editor' );

	return {
		resetContent: ( html ) => {
			const blocks = parse( html );
			return resetEditorBlocks( blocks );
		},
	};
} )( __experimentalPageTemplatePicker );
