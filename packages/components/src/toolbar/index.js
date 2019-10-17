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
 * Renders a toolbar with controls.
 *
 * The `controls` prop accepts an array of sets. A set is an array of controls.
 * Controls have the following shape:
 *
 * ```
 * {
 *   icon: string,
 *   title: string,
 *   subscript: string,
 *   onClick: Function,
 *   isActive: boolean,
 *   isDisabled: boolean
 * }
 * ```
 *
 * For convenience it is also possible to pass only an array of controls. It is
 * then assumed this is the only set.
 *
 * Either `controls` or `children` is required, otherwise this components
 * renders nothing.
 *
 * @param {Object}        props
 * @param {Array}        [props.controls]  The controls to render in this toolbar.
 * @param {ReactElement} [props.children]  Any other things to render inside the
 *                                         toolbar besides the controls.
 * @param {string}       [props.className] Class to set on the container div.
 *
 * @return {ReactElement} The rendered toolbar.
 */
function Toolbar( { className, accessibilityLabel, ...otherProps } ) {
	const cls = classnames( 'components-toolbar', className );

	if ( accessibilityLabel ) {
		return (
			<ToolbarContainer
				className={ cls }
				accessibilityLabel={ accessibilityLabel }
				{ ...otherProps }
			/>
		);
	}

	deprecated( 'Using `Toolbar` as a collapsible group of controls', {
		alternative: '`ToolbarGroup`',
	} );

	return <ToolbarGroup className={ cls } { ...otherProps } />;
}

export default Toolbar;
