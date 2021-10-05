/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import ContextMenu from './context-menu';
import ScreenHeader from './header';

function ScreenBlock( { name } ) {
	const blockType = getBlockType( name );
	const { blocks } = useGlobalStylesContext();

	return (
		<>
			<ScreenHeader back="/blocks" title={ blockType.title } />
			<ContextMenu
				parentMenu={ '/blocks/' + name }
				context={ blocks[ name ] }
			/>
		</>
	);
}

export default ScreenBlock;
