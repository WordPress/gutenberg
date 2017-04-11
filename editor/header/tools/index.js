/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from '../../components/dashicon';
import IconButton from '../../components/icon-button';
import Inserter from '../../components/inserter';
import Button from '../../components/button';

function Tools() {
	return (
		<div className="editor-tools">
			<IconButton icon="undo" label={ wp.i18n.__( 'Undo' ) } />
			<IconButton icon="redo" label={ wp.i18n.__( 'Redo' ) } />
			<Inserter />
			<div className="editor-tools__tabs">
				<Button>
					<Dashicon icon="visibility" />
					{ wp.i18n._x( 'Preview', 'imperative verb' ) }
				</Button>
				<Button>
					<Dashicon icon="admin-generic" />
					{ wp.i18n.__( 'Post Settings' ) }
				</Button>
			</div>
			<Button isPrimary isLarge>
				{ wp.i18n.__( 'Publish' ) }
			</Button>
		</div>
	);
}

export default Tools;
