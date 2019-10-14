/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import ToolbarContainer from './toolbar-container';
import ToolbarGroup from '../toolbar-group';

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

	return <ToolbarGroup className={ cls } { ...otherProps } />;
}

export default Toolbar;
