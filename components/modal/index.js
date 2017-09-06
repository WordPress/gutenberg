/**
 * External dependencies
 */
import classnames from 'classnames';
import { Fill } from 'react-slot-fill';

/**
 * Internal dependencies
 */
import './style.scss';

function Modal( { isSidebarOpened, children } ) {
	return (
		<div className={ classnames( 'components-modal', { 'is-sidebar-open': isSidebarOpened } ) }>
			<div className={ 'components-modal__content' }>
				{ children }
			</div>
		</div>
	);
}

export default ( props ) => <Fill name="Editor.Modal"><Modal { ...props } /></Fill>;
