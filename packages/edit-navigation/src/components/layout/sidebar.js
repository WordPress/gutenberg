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

/**
 * Internal dependencies
 */
import {
	COMPLEMENTARY_AREA_SCOPE,
	COMPLEMENTARY_AREA_ID,
} from '../../constants';

function useTogglePermanentSidebar( hasPermanentSidebar ) {
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		interfaceStore
	);

	useEffect( () => {
		if ( hasPermanentSidebar ) {
			enableComplementaryArea(
				COMPLEMENTARY_AREA_SCOPE,
				COMPLEMENTARY_AREA_ID
			);
		} else {
			disableComplementaryArea(
				COMPLEMENTARY_AREA_SCOPE,
				COMPLEMENTARY_AREA_ID
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
			scope={ COMPLEMENTARY_AREA_SCOPE }
			identifier={ COMPLEMENTARY_AREA_ID }
			icon={ cog }
			isActiveByDefault={ hasPermanentSidebar }
			header={ <></> }
			isPinnable={ ! hasPermanentSidebar }
		>
			<BlockInspector />
		</ComplementaryArea>
	);
}
