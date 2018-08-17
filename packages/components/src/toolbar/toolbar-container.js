/**
 * External dependencies
 */
import classnames from 'classnames';

const ToolbarContainer = ( props ) => (
	<div className={ classnames( 'components-toolbar', props.className ) }>
		{ props.children }
	</div>
);
export default ToolbarContainer;
