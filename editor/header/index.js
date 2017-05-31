/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import MultiSelectHeader from './multi-select';
import ModeSwitcher from './mode-switcher';
import SavedState from './saved-state';
import Tools from './tools';
import { getSelectedBlocks } from '../selectors';

function Header( { selectedBlocks } ) {
	if ( selectedBlocks.length ) {
		return <MultiSelectHeader selectedBlocks={ selectedBlocks } />;
	}

	return (
		<header className="editor-header">
			<ModeSwitcher />
			<SavedState />
			<Tools />
		</header>
	);
}

export default connect(
	( state ) => ( {
		selectedBlocks: getSelectedBlocks( state ),
	} )
)( Header );
