/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToGroupButton from './convert-button';

function ConvertToGroupButtons( { clientIds } ) {
	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<Fragment>
					<ConvertToGroupButton
						clientIds={ clientIds }
						onToggle={ onClose }
					/>
				</Fragment>
			) }
		</BlockSettingsMenuControls>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( 'core/block-editor' );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( ConvertToGroupButtons );
