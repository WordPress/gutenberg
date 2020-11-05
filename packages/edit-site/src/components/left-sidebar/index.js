/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterPanel from './inserter-panel';

const LeftSidebar = () => {
	const { isInserterOpen } = useSelect( ( select ) => {
		const { isInserterOpened } = select( 'core/edit-site' );
		return {
			isInserterOpen: isInserterOpened(),
		};
	} );

	const { setIsInserterOpened } = useDispatch( 'core/edit-site' );

	if ( isInserterOpen ) {
		return (
			<InserterPanel
				closeInserter={ () => setIsInserterOpened( false ) }
			/>
		);
	}

	return null;
};

export default LeftSidebar;
