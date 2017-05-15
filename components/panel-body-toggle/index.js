/**
 * WordPress dependencies
 */
import Dashicon from 'components/icon-button';

/**
 * Internal Dependencies
 */
import './style.scss';

function PanelBodyToggle( { opened, label, onClick } ) {
	return (
		<button className="components-panel-body-toggle" onClick={ onClick }>
			<strong>{ label }</strong>
			<Dashicon icon={ opened ? 'arrow-down' : 'arrow-right' } />
		</button>
	);
}

export default PanelBodyToggle;
