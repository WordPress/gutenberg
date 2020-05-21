/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import PanelHeader from './header';

function Panel( { header, className, children, ...props } ) {
	const classNames = classnames( className, 'components-panel' );
	return (
		<div className={ classNames } { ...props }>
			{ header && <PanelHeader label={ header } /> }
			{ children }
		</div>
	);
}

export default Panel;
