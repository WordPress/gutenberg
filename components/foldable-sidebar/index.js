/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import withFocusReturn from '../higher-order/with-focus-return';

const FoldableSidebar = ( { className, children, ...props } ) => {
	return (
		<div
			className={ classnames( className, 'components-foldable-sidebar' ) }
			{ ...props }
		>
			{ children }
		</div>
	);
};

export default withFocusReturn( FoldableSidebar );
