/**
 * WordPress Dependencies
 */
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { MenuItem, MenuGroup } from '@wordpress/components';

export function OptionsMenuItem( { openModal, onSelect } ) {
	return (
		<MenuGroup
			role={ 'group' }
			useEventToOffset={ false }
			label={ __( 'Options' ) }
			isScreenReaderLabel={ true }
			>
			<MenuItem
				onClick={ () => {
					onSelect();
					openModal( 'edit-post/options' );
				} }
			>
				{ __( 'Options' ) }
			</MenuItem>
		</MenuGroup>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( 'core/edit-post' );

	return {
		openModal,
	};
} )( OptionsMenuItem );
