/**
 * Internal dependencies
 */
import InserterPanel from './inserter-panel';
import NavigationPanel from './navigation-panel';

const LeftSidebar = ( { content, setContent } ) => {
	let leftSidebar = null;

	if ( content === 'navigation' ) {
		leftSidebar = <NavigationPanel />;
	} else if ( content === 'inserter' ) {
		leftSidebar = (
			<InserterPanel closeInserter={ () => setContent( null ) } />
		);
	}

	return leftSidebar;
};

export default LeftSidebar;
