/**
 * External dependencies
 */
import classnames from 'classnames';
import { flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import ToolbarButton from '../toolbar-button';
import DropdownMenu from '../dropdown-menu';
import ToolbarContainer from './toolbar-container';

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
 * @param {?Array}        controls  The controls to render in this toolbar.
 * @param {?ReactElement} children  Any other things to render inside the
 *                                  toolbar besides the controls.
 * @param {?string}       className Class to set on the container div.
 *
 * @return {ReactElement} The rendered toolbar.
 */
function Toolbar( { controls = [], children, className, isCollapsed, icon, label, ...otherProps } ) {
	if (
		( ! controls || ! controls.length ) &&
		! children
	) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets = controls;
	if ( ! Array.isArray( controlSets[ 0 ] ) ) {
		controlSets = [ controlSets ];
	}

	if ( isCollapsed ) {
		return (
			<DropdownMenu
				icon={ icon }
				label={ label }
				controls={ controlSets }
				className={ classnames( 'components-toolbar', className ) }
			/>
		);
	}

	return (
		<ToolbarContainer className={ classnames( 'components-toolbar', className ) } { ...otherProps }>
			{ flatMap( controlSets, ( controlSet, indexOfSet ) => (
				controlSet.map( ( control, indexOfControl ) => (
					<ToolbarButton
						key={ [ indexOfSet, indexOfControl ].join() }
						containerClassName={ indexOfSet > 0 && indexOfControl === 0 ? 'has-left-divider' : null }
						{ ...control }
					/>
				) )
			) ) }
			{ children }
		</ToolbarContainer>
	);
}

export default Toolbar;
