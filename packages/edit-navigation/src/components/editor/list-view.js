/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __experimentalBlockNavigationTree } from '@wordpress/block-editor';

export default function ListView( { isPending, blocks } ) {
	const [ selectedBlockId, setSelectedBlockId ] = useState(
		blocks[ 0 ]?.clientId
	);

	return (
		<div className="edit-navigation-editor__list-view">
			{ isPending ? (
				<Spinner />
			) : (
				<__experimentalBlockNavigationTree
					blocks={ blocks }
					selectedBlockClientId={ selectedBlockId }
					selectBlock={ setSelectedBlockId }
					__experimentalFeatures
					showNestedBlocks
					showAppender
					showBlockMovers
				/>
			) }
		</div>
	);
}
