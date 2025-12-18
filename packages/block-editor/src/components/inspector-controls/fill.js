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
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../block-edit/context';
import groups from './groups';

/**
 * Resolves the group for inspector controls based on attribute metadata.
 *
 * @param {string} blockName     The block name.
 * @param {string} attributeName The attribute name.
 * @return {string} The resolved group.
 */
function getAttributeGroup( blockName, attributeName ) {
	const blockType = getBlockType( blockName );
	const attribute = blockType?.attributes?.[ attributeName ];

	if ( attribute?.group ) {
		return attribute.group;
	}

	if ( attribute?.role === 'content' ) {
		return 'content';
	}

	return 'default';
}

export default function InspectorControlsFill( {
	children,
	group,
	attribute,
	__experimentalGroup,
	resetAllFilter,
} ) {
	const context = useBlockEditContext();

	if ( __experimentalGroup ) {
		deprecated(
			'`__experimentalGroup` property in `InspectorControlsFill`',
			{
				since: '6.2',
				version: '6.4',
				alternative: '`group`',
			}
		);
	}

	if ( group && attribute ) {
		warning(
			'InspectorControls: `group` and `attribute` props are mutually exclusive. Use one or the other.'
		);
	}

	const resolvedGroup =
		__experimentalGroup ??
		group ??
		( attribute ? getAttributeGroup( context.name, attribute ) : null ) ??
		'default';

	const Fill = groups[ resolvedGroup ]?.Fill;
	if ( ! Fill ) {
		warning(
			`Unknown InspectorControls group "${ resolvedGroup }" provided.`
		);
		return null;
	}
	if ( ! context[ mayDisplayControlsKey ] ) {
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
