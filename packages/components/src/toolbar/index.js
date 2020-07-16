/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

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
 * @param {Object} props                                    Component props.
 * @param {string} [props.className]                        Class to set on the container div.
 * @param {string} [props.accessibilityLabel] ARIA label for toolbar container.
 * @param {Object} ref                                      React Element ref.
 */
function Toolbar( { className, accessibilityLabel, ...props }, ref ) {
	if ( accessibilityLabel ) {
		return (
			<ToolbarContainer
				// `ToolbarGroup` already uses components-toolbar for compatibility reasons
				className={ classnames(
					'components-accessible-toolbar',
					className
				) }
				accessibilityLabel={ accessibilityLabel }
				ref={ ref }
				{ ...props }
			/>
		);
	}
	// TODO
	// When the accessibilityLabel prop is not passed, Toolbar will fallback to
	// ToolbarGroup. This should be deprecated as soon as the new API gets stable.
	// See https://github.com/WordPress/gutenberg/pull/20008#issuecomment-624503410
	return <ToolbarGroup { ...props } className={ className } />;
}

export default forwardRef( Toolbar );
