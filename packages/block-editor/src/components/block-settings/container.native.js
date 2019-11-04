/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './container.native.scss';

function BottomSheetSettings( { editorSidebarOpened, closeGeneralSidebar, ...props } ) {
	return (
		<BottomSheet
			isVisible={ editorSidebarOpened }
			onClose={ closeGeneralSidebar }
			hideHeader
			contentStyle={ styles.content }
			{ ...props }
		>
			<InspectorControls.Slot	/>
		</BottomSheet>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isEditorSidebarOpened,
		} = select( 'core/edit-post' );

		return {
			editorSidebarOpened: isEditorSidebarOpened(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { closeGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			closeGeneralSidebar,
		};
	} ),
]
)( BottomSheetSettings );
