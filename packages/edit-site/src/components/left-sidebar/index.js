/**
 * Internal dependencies
 */
import InserterPanel from './inserter-panel';
import NavigationPanel from './navigation-panel';

const LeftSidebar = ( { content, setContent } ) => {
	if ( content === 'navigation' ) {
		return <NavigationPanel />;
	}

	if ( content === 'inserter' ) {
		return <InserterPanel closeInserter={ () => setContent( null ) } />;
	}

	return null;
};

export default LeftSidebar;
