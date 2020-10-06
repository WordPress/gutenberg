/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterPanel from './inserter-panel';

const LeftSidebar = () => {
	const { isNavigationOpen, isInserterOpen } = useSelect( ( select ) => {
		const { isNavigationOpened, isInserterOpened } = select(
			'core/edit-site'
		);
		return {
			isNavigationOpen: isNavigationOpened(),
			isInserterOpen: isInserterOpened(),
		};
	} );

	const { setIsInserterOpened } = useDispatch( 'core/edit-site' );

	// if ( isNavigationOpen ) {
	// 	return <NavigationPanel />;
	// }

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
