/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ToolbarGroup from '../toolbar-group';
import ToolbarContainer from './toolbar-container';
import { ToolbarProvider } from '../toolbar-context';

export { ToolbarContainer };

/**
 * Renders an accessible toolbar that follows the
 * [WAI-ARIA Toolbar Pattern](https://www.w3.org/TR/wai-aria-practices/#toolbar).
 *
 * The `accessibilityLabel` is required. Otherwise it will produce a warning.
 *
 * To add controls, simply pass `ToolbarButton` components as children.
 *
 * @param {Object} props
 * @param {string} props.accessibilityLabel Required label for assistive technology users.
 * @param {string} [props.className]
 * @param {Object} ref
 */
const Toolbar = forwardRef( ( { accessibilityLabel, ...props }, ref ) => {
	if ( accessibilityLabel ) {
		return (
			<ToolbarProvider>
				<ToolbarContainer
					ref={ ref }
					accessibilityLabel={ accessibilityLabel }
					{ ...props }
				/>
			</ToolbarProvider>
		);
	}

	deprecated( 'Using `Toolbar` as a collapsible group of controls', {
		alternative: '`ToolbarGroup`',
		hint: 'If you want to render an accessible toolbar, pass in an `accessibilityLabel` prop.',
	} );

	return <ToolbarGroup { ...props } />;
} );

export default Toolbar;
