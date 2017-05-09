/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from '../icon-button';

function Toolbar( { controls } ) {
	if ( ! controls || ! controls.length ) {
		return null;
	}

	return (
		<ul className="editor-toolbar">
			{ controls.map( ( control, index ) => (
				<IconButton
					key={ index }
					icon={ control.icon }
					label={ control.title }
					data-subscript={ control.subscript }
					onClick={ ( event ) => {
						event.stopPropagation();
						control.onClick();
					} }
					className={ classNames( 'editor-toolbar__control', {
						'is-active': control.isActive
					} ) }
					aria-pressed={ control.isActive }
				/>
			) ) }
		</ul>
	);
}

export default Toolbar;
