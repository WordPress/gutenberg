/**
 * WordPress dependencies
 */
import { __experimentalBlockSettingsMenuPluginsExtension } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlockDeleteButton from './reusable-block-delete-button';

function ReusableBlocksButtons( { clientIds } ) {
	return (
		<__experimentalBlockSettingsMenuPluginsExtension>
			{ ( { onClose } ) => (
				<>
					<ReusableBlockConvertButton
						clientIds={ clientIds }
						onToggle={ onClose }
					/>
					{ clientIds.length === 1 && (
						<ReusableBlockDeleteButton
							clientId={ clientIds[ 0 ] }
							onToggle={ onClose }
						/>
					) }
				</>
			) }
		</__experimentalBlockSettingsMenuPluginsExtension>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( 'core/block-editor' );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( ReusableBlocksButtons );
