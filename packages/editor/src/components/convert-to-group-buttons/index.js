/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __experimentalBlockSettingsMenuPluginsExtension } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToGroupButton from './convert-button';

function ConvertToGroupButtons( { clientIds } ) {
	return (
		<__experimentalBlockSettingsMenuPluginsExtension>
			{ ( { onClose } ) => (
				<Fragment>
					<ConvertToGroupButton
						clientIds={ clientIds }
						onToggle={ onClose }
					/>
				</Fragment>
			) }
		</__experimentalBlockSettingsMenuPluginsExtension>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( 'core/block-editor' );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( ConvertToGroupButtons );
