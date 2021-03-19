/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';

const BLOCK_INSPECTOR_SCOPE = 'core/edit-navigation';
const BLOCK_INSPECTOR_IDENTIFIER = 'edit-navigation/block-inspector';

function useTogglePermanentSidebar( hasPermanentSidebar ) {
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		interfaceStore
	);

	useEffect( () => {
		if ( hasPermanentSidebar ) {
			enableComplementaryArea(
				BLOCK_INSPECTOR_SCOPE,
				BLOCK_INSPECTOR_IDENTIFIER
			);
		} else {
			disableComplementaryArea(
				BLOCK_INSPECTOR_SCOPE,
				BLOCK_INSPECTOR_IDENTIFIER
			);
		}
	}, [
		hasPermanentSidebar,
		enableComplementaryArea,
		disableComplementaryArea,
	] );
}

export default function Sidebar( { hasPermanentSidebar } ) {
	useTogglePermanentSidebar( hasPermanentSidebar );

	return (
		<ComplementaryArea
			className="edit-navigation-sidebar"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close settings' ) }
			scope={ BLOCK_INSPECTOR_SCOPE }
			identifier={ BLOCK_INSPECTOR_IDENTIFIER }
			icon={ cog }
			isActiveByDefault={ hasPermanentSidebar }
			header={ <></> }
			isPinnable={ ! hasPermanentSidebar }
		>
			<BlockInspector />
		</ComplementaryArea>
	);
}
