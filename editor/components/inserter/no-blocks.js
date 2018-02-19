/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function NoBlocks( props ) {
	const { children } = props;
	return (
		<span className="editor-inserter__no-blocks">
			{ !! children ? children : __( 'No blocks found' ) }
		</span>
	);
}

export default NoBlocks;
