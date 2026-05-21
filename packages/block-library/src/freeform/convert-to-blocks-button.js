/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { rawHandler } from '@wordpress/blocks';

const ConvertToBlocksButton = ( { content, onReplace } ) => {
	return (
		<ToolbarButton
			onClick={ () => onReplace( rawHandler( { HTML: content } ) ) }
		>
			{ __( 'Convert to blocks' ) }
		</ToolbarButton>
	);
};

export default ConvertToBlocksButton;
