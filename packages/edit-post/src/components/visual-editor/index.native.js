/**
 * WordPress dependencies
 */
import { BlockList } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Header from './header';

export default function VisualEditor( { safeAreaBottomInset, setTitleRef } ) {
	return (
		<BlockList
			header={ <Header setTitleRef={ setTitleRef } /> }
			safeAreaBottomInset={ safeAreaBottomInset }
			autoScroll={ true }
		/>
	);
}
