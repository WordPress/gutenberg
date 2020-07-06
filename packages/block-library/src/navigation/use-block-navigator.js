/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ToolbarButton, SVG, Path, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationList from './block-navigation-list';

const NavigatorIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
	>
		<Path d="M13.8 5.2H3v1.5h10.8V5.2zm-3.6 12v1.5H21v-1.5H10.2zm7.2-6H6.6v1.5h10.8v-1.5z" />
	</SVG>
);

export default function useBlockNavigator( clientId, __experimentalFeatures ) {
	const [ isNavigationListOpen, setIsNavigationListOpen ] = useState( false );

	const navigatorToolbarButton = (
		<ToolbarButton
			className="components-toolbar__control"
			label={ __( 'Open block navigator' ) }
			onClick={ () => setIsNavigationListOpen( true ) }
			icon={ NavigatorIcon }
		/>
	);

	const navigatorModal = isNavigationListOpen && (
		<Modal
			title={ __( 'Block Navigator' ) }
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
