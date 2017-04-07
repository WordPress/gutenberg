/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from 'components/dashicon';

function Toolbar( { controls } ) {
	if ( ! controls || ! controls.length ) {
		return null;
	}

	return (
		<ul className="editor-toolbar">
			{ controls.map( ( control, index ) => (
				<button
					key={ index }
					className={ classNames( 'editor-toolbar__control', {
						'is-active': control.isActive && control.isActive()
					} ) }
					title={ control.title }
					onClick={ ( event ) => {
						event.stopPropagation();
						control.onClick();
					} }
				>
					<Dashicon icon={ control.icon } />
				</button>
			) ) }
		</ul>
	);
}

export default Toolbar;
