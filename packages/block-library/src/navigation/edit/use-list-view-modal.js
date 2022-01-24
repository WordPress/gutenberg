/**
 * WordPress dependencies
 */
import {
	__experimentalListView as ListView,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { listView } from '@wordpress/icons';

function NavigationBlockListView( { clientId, __experimentalFeatures } ) {
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

export default function useListViewModal( clientId, __experimentalFeatures ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const listViewToolbarButton = (
		<ToolbarButton
			className="components-toolbar__control"
			label={ __( 'Open list view' ) }
			onClick={ () => setIsModalOpen( true ) }
			icon={ listView }
		/>
	);

	const listViewModal = isModalOpen && (
		<Modal
			title={ __( 'List View' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ () => {
				setIsModalOpen( false );
			} }
			shouldCloseOnClickOutside={ false }
		>
			<NavigationBlockListView
				clientId={ clientId }
				__experimentalFeatures={ __experimentalFeatures }
			/>
		</Modal>
	);

	return {
		listViewToolbarButton,
		listViewModal,
	};
}
