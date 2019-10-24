/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ToolbarGroup from '../toolbar-group';
import ToolbarContainer from './toolbar-container';
import ToolbarContext from './toolbar-context';

export const __unstableToolbarContext = ToolbarContext;

/**
 * Renders an accessible toolbar that follows the
 * [WAI-ARIA Toolbar Pattern](https://www.w3.org/TR/wai-aria-practices/#toolbar).
 *
 * The `accessibilityLabel` is required. Otherwise it will produce a warning.
 *
 * To add controls, simply pass `ToolbarButton` components as children.
 *
 * @param {Object} props
 * @param {string} props.accessibilityLabel Required label for assistive technology users
 * @param {string} [props.className]
 */
function Toolbar( { className, accessibilityLabel, ...otherProps } ) {
	if ( accessibilityLabel ) {
		return (
			<ToolbarContainer
				className={ classnames( 'components-accessible-toolbar', className ) }
				accessibilityLabel={ accessibilityLabel }
				{ ...otherProps }
			/>
		);
	}

	deprecated( 'Using `Toolbar` as a collapsible group of controls', {
		alternative: '`ToolbarGroup`',
		hint: 'If you want to render an accessible toolbar, pass in an `accessibilityLabel` prop.',
	} );

	return <ToolbarGroup { ...otherProps } />;
}

export default Toolbar;
