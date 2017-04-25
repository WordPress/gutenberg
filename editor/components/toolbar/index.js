/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from 'components/icon-button';

function Toolbar( { attributes, setAttributes, controls } ) {
	if ( ! controls || ! controls.length ) {
		return null;
	}

	return (
		<ul className="editor-toolbar">
			{ controls.map( ( control, index ) => {
				if ( control.edit ) {
					const element = wp.element.createElement( control.edit, { attributes, setAttributes } );
					return wp.element.cloneElement( element, { key: index } );
				}

				return (
					<IconButton
						key={ index }
						icon={ control.icon }
						label={ control.title }
						data-subscript={ control.subscript }
						onClick={ ( event ) => {
							event.stopPropagation();
							control.onClick( attributes, setAttributes );
						} }
						className={ classNames( 'editor-toolbar__control', {
							'is-active': control.isActive && control.isActive( attributes )
						} ) } />
				);
			} ) }
		</ul>
	);
}

export default Toolbar;
