/**
 * WordPress dependencies
 */
import {
	__experimentalListView as ListView,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useRef, useEffect, useState } from '@wordpress/element';

export default function BlockNavigationList( {
	clientId,
	__experimentalFeatures,
} ) {
	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).__unstableGetClientIdsTree( clientId ),
		[ clientId ]
	);

	const listViewRef = useRef();
	const [ minHeight, setMinHeight ] = useState( 300 );
	useEffect( () => {
		setMinHeight( listViewRef?.current?.clientHeight ?? 300 );
	}, [] );

	return (
		<div style={ { minHeight } }>
			<ListView
				ref={ listViewRef }
				blocks={ blocks }
				showBlockMovers
				showNestedBlocks
				__experimentalFeatures={ __experimentalFeatures }
			/>
		</div>
	);
}
