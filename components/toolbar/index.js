/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from '../icon-button';

function Toolbar( { controls, focus } ) {
	if ( ! controls || ! controls.length ) {
		return null;
	}

	return (
		<ul className="components-toolbar">
			{ controls.map( ( control, index ) => (
				<li
					key={ index }
					className={ control.leftDivider ? 'left-divider' : null }
				>
					<IconButton
						icon={ control.icon }
						label={ control.title }
						data-subscript={ control.subscript }
						onClick={ ( event ) => {
							event.stopPropagation();
							control.onClick();
						} }
						className={ classNames( 'components-toolbar__control', {
							'is-active': control.isActive,
						} ) }
						aria-pressed={ control.isActive }
						focus={ focus && ! index }
						disabled={ control.isDisabled }
					/>
					{ control.children }
				</li>
			) ) }
		</ul>
	);
}

export default Toolbar;
