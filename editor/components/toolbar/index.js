/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from 'components/icon-button';

class Toolbar extends wp.element.Component {
	render() {
		const { controls } = this.props;
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
						} ) } />
				) ) }
			</ul>
		);
	}
}

export default Toolbar;
