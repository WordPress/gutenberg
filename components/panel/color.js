/**
 * Internal dependencies
 */
import './style.scss';
import PanelBody from './body';

function PanelColor( { colorValue, title, ...props } ) {
	return (
		<PanelBody
			{ ...props }
			title={ [
				<span className="components-panel__color-title" key="title">{ title }</span>,
				colorValue && <span className="components-panel__color-area" key="color" style={ { background: colorValue } } />,
			] }
		/>
	);
}

export default PanelColor;
