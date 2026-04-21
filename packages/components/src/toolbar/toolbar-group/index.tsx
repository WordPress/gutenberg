/**
 * External dependencies
 */
import clsx from 'clsx';

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
import ToolbarContext from '../toolbar-context';
import type { ToolbarGroupProps, ToolbarGroupControls } from './types';

function isNestedArray< T = any >( arr: T[] | T[][] ): arr is T[][] {
	return Array.isArray( arr ) && Array.isArray( arr[ 0 ] );
}

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
 *
 * @param props               Component props.
 * @param [props.controls]    The controls to render in this toolbar.
 * @param [props.children]    Any other things to render inside the toolbar besides the controls.
 * @param [props.className]   Class to set on the container div.
 * @param [props.isCollapsed] Turns ToolbarGroup into a dropdown menu.
 * @param [props.title]       ARIA label for dropdown menu if is collapsed.
 */
function ToolbarGroup( {
	controls = [],
	children,
	className,
	isCollapsed,
	title,
	...props
}: ToolbarGroupProps ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar label="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ( ! controls || ! controls.length ) && ! children ) {
		return null;
	}

	const finalClassName = clsx(
		// Unfortunately, there's legacy code referencing to `.components-toolbar`
		// So we can't get rid of it
		accessibleToolbarState
			? 'components-toolbar-group'
			: 'components-toolbar',
		className
	);

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets: ToolbarGroupControls[][];
	if ( isNestedArray( controls ) ) {
		controlSets = controls;
	} else {
		controlSets = [ controls ];
	}

	if ( isCollapsed ) {
		return (
			<ToolbarGroupCollapsed
				label={ title }
				controls={ controlSets }
				className={ finalClassName }
				children={ children }
				{ ...props }
			/>
		);
	}

	return (
		<ToolbarGroupContainer className={ finalClassName } { ...props }>
			{ controlSets?.flatMap( ( controlSet, indexOfSet ) =>
				controlSet.map( ( control, indexOfControl: number ) => (
					<ToolbarButton
						key={ [ indexOfSet, indexOfControl ].join() }
						containerClassName={
							indexOfSet > 0 && indexOfControl === 0
								? 'has-left-divider'
								: undefined
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
