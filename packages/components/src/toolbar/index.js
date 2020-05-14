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
 * @param {Object} props             Component props.
 * @param {string} [props.className] Class to set on the container div.
 * @param {Object} ref               React Element ref.
 */
function Toolbar(
	{ className, __experimentalAccessibilityLabel, ...props },
	ref
) {
	if ( __experimentalAccessibilityLabel ) {
		return (
			<ToolbarContainer
				// `ToolbarGroup` already uses components-toolbar for compatibility reasons
				className={ classnames(
					'components-accessible-toolbar',
					className
				) }
				accessibilityLabel={ __experimentalAccessibilityLabel }
				ref={ ref }
				{ ...props }
			/>
		);
	}
	// When the __experimentalAccessibilityLabel prop is not passed, Toolbar will
	// fallback to ToolbarGroup. This should be deprecated as soon as the new API
	// gets stable.
	// See https://github.com/WordPress/gutenberg/pull/20008#issuecomment-624503410
	return <ToolbarGroup { ...props } className={ className } />;
}

export default forwardRef( Toolbar );
