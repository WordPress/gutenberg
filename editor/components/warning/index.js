/**
 * Internal dependencies
 */
import './style.scss';

function Warning( { children } ) {
	return (
		<div className="editor-warning">
			{ children }
		</div>
	);
}

export default Warning;
