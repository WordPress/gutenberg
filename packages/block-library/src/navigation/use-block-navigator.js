/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ToolbarButton, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { listView } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockNavigationList from './block-navigation-list';

export default function useBlockNavigator( clientId, __experimentalFeatures ) {
	const [ isNavigationListOpen, setIsNavigationListOpen ] = useState( false );

	const navigatorToolbarButton = (
		<ToolbarButton
			className="components-toolbar__control"
			label={ __( 'Open block navigation' ) }
			onClick={ () => setIsNavigationListOpen( true ) }
			icon={ listView }
		/>
	);

	const navigatorModal = isNavigationListOpen && (
		<Modal
			title={ __( 'Navigation' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ () => {
				setIsNavigationListOpen( false );
			} }
		>
			<BlockNavigationList
				clientId={ clientId }
				__experimentalFeatures={ __experimentalFeatures }
			/>
		</Modal>
	);

	return {
		navigatorToolbarButton,
		navigatorModal,
	};
}
