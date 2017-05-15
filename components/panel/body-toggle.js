/**
 * WordPress dependencies
 */
import Dashicon from 'components/icon-button';

function PanelBodyToggle( { opened, label, onClick } ) {
	return (
		<button className="components-panel__body-toggle" onClick={ onClick }>
			<strong>{ label }</strong>
			<Dashicon className="components-panel__body-toggle-icon" icon={ opened ? 'arrow-down' : 'arrow-right' } />
		</button>
	);
}

export default PanelBodyToggle;
