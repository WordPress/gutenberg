/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import __experimentalBlockListFooter from '../block-list-footer';

const __experimentalPageTemplatePicker = ( { templates, resetContent } ) => {
	return (
		<__experimentalBlockListFooter>
			{ templates.map( ( { name, content } ) => (
				<Button key={ name } onClick={ () => resetContent( content ) }>
					{ name }
				</Button>
			) ) }
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
