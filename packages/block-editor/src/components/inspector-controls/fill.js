import {
	__experimentalStyleProvider as StyleProvider,
	__experimentalToolsPanelContext as ToolsPanelContext,
} from '@wordpress/components';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';
import { useEffect, useContext, useMemo } from '@wordpress/element';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
	mayDisplayPatternEditingControlsKey,
	isInListViewBlockSupportTreeKey,
} from '../block-edit/context';
import groups from './groups';
import {
	scopeResetAllFilterToState,
	useBlockStyleState,
} from '../../hooks/block-style-state';
import { ListViewContentFill } from './list-view-content-popover';

const PATTERN_EDITING_GROUPS = [ 'content', 'list' ];

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
	const isSelectedBlock = context[ mayDisplayControlsKey ];
	const isPatternEditing = context[ mayDisplayPatternEditingControlsKey ];
	const isInListViewTree = context[ isInListViewBlockSupportTreeKey ];

	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}

	// During pattern editing:
	// - All blocks can show pattern editing groups (content, list).
	// - Template parts can show any inspector group.
	// - Other blocks cannot show a settings tab.
	if ( isPatternEditing ) {
		// Template parts have also historically supported
		// any block inspector groups for extenders. The settings
		// tab is also used by core for the 'Design' panel. Specifically
		// for that block the restrictions on allowed groups are lessened.
		const isTemplatePart = context.name === 'core/template-part';
		const isPatternEditingGroup = PATTERN_EDITING_GROUPS.includes( group );
		const canShowGroup = isTemplatePart || isPatternEditingGroup;

		if ( ! canShowGroup ) {
			return null;
		}
	} else if ( ! isSelectedBlock ) {
		// Outside pattern editing, use the standard rules for displaying controls.
		return null;
	}

	// When inside a section with a parent that has ListView block support,
	// content controls are rendered as part of the ListView via a popover.
	const rendersInListView =
		group === 'content' && isPatternEditing && isInListViewTree;

	// When using the ListView fill, only render controls for the selected
	// block. Other blocks return `null`.
	if ( rendersInListView && ! isSelectedBlock ) {
		return null;
	}

	return (
		<StyleProvider document={ document }>
			{ rendersInListView ? (
				<ListViewContentFill>{ children }</ListViewContentFill>
			) : (
				<Fill>
					{ ( fillProps ) => (
						<ToolsPanelInspectorControl
							fillProps={ fillProps }
							resetAllFilter={ resetAllFilter }
						>
							{ children }
						</ToolsPanelInspectorControl>
					) }
				</Fill>
			) }
		</StyleProvider>
	);
}

function RegisterResetAll( { resetAllFilter, children } ) {
	const { registerResetAllFilter, deregisterResetAllFilter } =
		useContext( ToolsPanelContext );
	const selectedState = useBlockStyleState();
	const scopedResetAllFilter = useMemo(
		() => scopeResetAllFilterToState( selectedState, resetAllFilter ),
		[ resetAllFilter, selectedState ]
	);
	useEffect( () => {
		if (
			scopedResetAllFilter &&
			registerResetAllFilter &&
			deregisterResetAllFilter
		) {
			registerResetAllFilter( scopedResetAllFilter );
			return () => {
				deregisterResetAllFilter( scopedResetAllFilter );
			};
		}
	}, [
		scopedResetAllFilter,
		registerResetAllFilter,
		deregisterResetAllFilter,
	] );
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
