/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { privateApis as blockEditorPrivateApis } from '../../private-apis';

export { BLOCK_LIST_ITEM_HEIGHT } from './private-list-view';

const { PrivateListView } = unlock( blockEditorPrivateApis );

export default forwardRef( ( props, ref ) => {
	return (
		<PrivateListView
			ref={ ref }
			{ ...props }
			showAppender={ false }
			rootClientId={ null }
			onSelect={ null }
			renderAdditionalBlockUI={ null }
		/>
	);
} );
