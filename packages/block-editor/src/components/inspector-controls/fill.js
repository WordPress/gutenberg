/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	__experimentalToolsPanelContext as ToolsPanelContext,
} from '@wordpress/components';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';
import { useEffect, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useBlockEditContext,
	mayDisplayControlsKey,
	mayDisplayPatternEditingControlsKey,
} from '../block-edit/context';
import groups from './groups';

const PATTERN_EDITING_GROUPS = [ 'content', 'list' ];
const TEMPLATE_PART_GROUPS = [ 'default', 'settings', 'advanced' ];

export default function InspectorControlsFill( {
	children,
	group = 'default',
	__experimentalGroup,
	resetAllFilter,
} ) {
	if ( __experimentalGroup ) {
		deprecated(
			'`__experimentalGroup` property in `InspectorControlsFill`',
			{
				since: '6.2',
				version: '6.4',
				alternative: '`group`',
			}
		);
		group = __experimentalGroup;
	}

	const context = useBlockEditContext();
	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}

	const shouldDisplayForPatternEditing =
		context[ mayDisplayPatternEditingControlsKey ] &&
		PATTERN_EDITING_GROUPS.includes( group );

	// For pattern editing, the template part is the only block that can display the settings tab.
	// This is to allow it to show 'Design' and 'Advanced' panels.
	const shouldDisplayTemplatePartSettings =
		context[ mayDisplayPatternEditingControlsKey ] &&
		context.name === 'core/template-part' &&
		TEMPLATE_PART_GROUPS.includes( group );

	if (
		! context[ mayDisplayControlsKey ] &&
		! shouldDisplayForPatternEditing &&
		! shouldDisplayTemplatePartSettings
	) {
		return null;
	}

	const hideNonTemplatePartSettings =
		context[ mayDisplayPatternEditingControlsKey ] &&
		context.name !== 'core/template-part' &&
		TEMPLATE_PART_GROUPS.includes( group );

	if ( hideNonTemplatePartSettings ) {
		return null;
	}

	return (
		<StyleProvider document={ document }>
			<Fill>
				{ ( fillProps ) => {
					return (
						<ToolsPanelInspectorControl
							fillProps={ fillProps }
							children={ children }
							resetAllFilter={ resetAllFilter }
						/>
					);
				} }
			</Fill>
		</StyleProvider>
	);
}

function RegisterResetAll( { resetAllFilter, children } ) {
	const { registerResetAllFilter, deregisterResetAllFilter } =
		useContext( ToolsPanelContext );
	useEffect( () => {
		if (
			resetAllFilter &&
			registerResetAllFilter &&
			deregisterResetAllFilter
		) {
			registerResetAllFilter( resetAllFilter );
			return () => {
				deregisterResetAllFilter( resetAllFilter );
			};
		}
	}, [ resetAllFilter, registerResetAllFilter, deregisterResetAllFilter ] );
	return children;
}

function ToolsPanelInspectorControl( { children, resetAllFilter, fillProps } ) {
	// `fillProps.forwardedContext` is an array of context provider entries, provided by slot,
	// that should wrap the fill markup.
	const { forwardedContext = [] } = fillProps;

	// Children passed to InspectorControlsFill will not have
	// access to any React Context whose Provider is part of
	// the InspectorControlsSlot tree. So we re-create the
	// Provider in this subtree.
	const innerMarkup = (
		<RegisterResetAll resetAllFilter={ resetAllFilter }>
			{ children }
		</RegisterResetAll>
	);
	return forwardedContext.reduce(
		( inner, [ Provider, props ] ) => (
			<Provider { ...props }>{ inner }</Provider>
		),
		innerMarkup
	);
}
