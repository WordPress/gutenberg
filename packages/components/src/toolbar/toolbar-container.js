/**
 * External dependencies
 */
import classnames from 'classnames';

export default ( props ) => (
	<div className={ classnames( 'components-toolbar', props.className ) }>
		{ props.children }
	</div>
);
