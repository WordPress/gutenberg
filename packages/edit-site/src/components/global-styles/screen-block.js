/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ContextMenu from './context-menu';
import ScreenHeader from './header';

function ScreenBlock( { name } ) {
	const blockType = getBlockType( name );

	return (
		<>
			<ScreenHeader title={ blockType.title } />
			<ContextMenu parentMenu={ '/blocks/' + name } name={ name } />
		</>
	);
}

export default ScreenBlock;
