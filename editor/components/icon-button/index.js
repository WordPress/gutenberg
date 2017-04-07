/**
 * Internal dependencies
 */
import './style.scss';
import Button from '../button';
import Dashicon from '../dashicon';

function IconButton( { icon, label } ) {
	return (
		<Button title={ label } className="editor-icon-button">
			<Dashicon icon={ icon } />
		</Button>
	);
}

export default IconButton;
