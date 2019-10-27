/**
 * External dependencies
 */
import classnames from 'classnames';
import { flatMap } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarButton from '../toolbar-button';
import ToolbarGroupContainer from './toolbar-group-container';
import ToolbarGroupCollapsed from './toolbar-group-collapsed';
import { ToolbarContext } from '../toolbar';

/**
 * Renders a collapsible group of controls
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
 */
function ToolbarGroup( {
	controls = [],
	children,
	className,
	isCollapsed,
	icon,
	title,
	...otherProps
} ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar accessibilityLabel="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ( ! controls || ! controls.length ) && ! children ) {
		return null;
	}

	const finalClassName = classnames(
		// Unfortunately, there's legacy code referencing to `.components-toolbar`
		// So we can't get rid of it
		accessibleToolbarState ? 'components-toolbar-group' : 'components-toolbar',
		className
	);

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets = controls;
	if ( ! Array.isArray( controlSets[ 0 ] ) ) {
		controlSets = [ controlSets ];
	}

	if ( isCollapsed ) {
		return (
			<ToolbarGroupCollapsed
				icon={ icon }
				label={ title }
				controls={ controlSets }
				className={ finalClassName }
				children={ children }
				{ ...otherProps }
			/>
		);
	}

	return (
		<ToolbarGroupContainer className={ finalClassName } { ...otherProps }>
			{ flatMap( controlSets, ( controlSet, indexOfSet ) =>
				controlSet.map( ( control, indexOfControl ) => (
					<ToolbarButton
						key={ [ indexOfSet, indexOfControl ].join() }
						containerClassName={
							indexOfSet > 0 && indexOfControl === 0 ? 'has-left-divider' : null
						}
						{ ...control }
					/>
				) )
			) }
			{ children }
		</ToolbarGroupContainer>
	);
}

export default ToolbarGroup;
