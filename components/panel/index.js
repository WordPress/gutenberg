/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import PanelHeader from 'components/panel-header';

/**
 * Internal dependencies
 */
import './style.scss';

function Panel( { header, className, children } ) {
	const classNames = classnames( className, 'components-panel' );
	return (
		<div className={ classNames }>
			{ header && <PanelHeader><strong>{ header }</strong></PanelHeader>}
			{ children }
		</div>
	);
}

export default Panel;
