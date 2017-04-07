/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from '../../components/dashicon';

function SavedState() {
	return (
		<div className="editor-saved-state">
			<Dashicon icon="yes" />
			{ wp.i18n.__( 'Saved' ) }
		</div>
	);
}

export default SavedState;
