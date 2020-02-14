/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { BlockSettingsMenuGroup } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToGroupButton from './convert-button';

function ConvertToGroupButtons( { clientIds } ) {
	return (
		<BlockSettingsMenuGroup>
			{ ( { onClose } ) => (
				<Fragment>
					<ConvertToGroupButton
						clientIds={ clientIds }
						onToggle={ onClose }
					/>
				</Fragment>
			) }
		</BlockSettingsMenuGroup>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( 'core/block-editor' );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( ConvertToGroupButtons );
