/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import ToolbarGroup from '../toolbar-group';
import ToolbarContainer from './toolbar-container';

/**
 * Renders a toolbar.
 *
 * To add controls, simply pass `ToolbarButton` components as children.
 *
 * @param {Object} props             Component props.
 * @param {string} [props.className] Class to set on the container div.
 */
function Toolbar( { className, __experimentalAccessibilityLabel, ...props } ) {
	if ( __experimentalAccessibilityLabel ) {
		return (
			<ToolbarContainer
				// `ToolbarGroup` already uses components-toolbar for compatibility reasons
				className={ classnames(
					'components-accessible-toolbar',
					className
				) }
				accessibilityLabel={ __experimentalAccessibilityLabel }
				{ ...props }
			/>
		);
	}

	return <ToolbarGroup { ...props } className={ className } />;
}

export default Toolbar;
