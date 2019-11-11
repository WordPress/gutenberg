/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';

import __experimentalBlockListFooter from '../block-list-footer';
import Button from './button';
import Container from './container';

const __experimentalPageTemplatePicker = ( { templates, resetContent } ) => {
	return (
		<__experimentalBlockListFooter>
			<Container style={ { flexDirection: 'row' } }>
				{ templates.map( ( { name, content } ) => (
					<Button
						key={ name }
						onPress={ () => resetContent( content ) }
						label={ name }
					/>
				) ) }
			</Container>
		</__experimentalBlockListFooter>
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
