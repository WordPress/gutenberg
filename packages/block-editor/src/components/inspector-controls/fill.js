/**
 * WordPress dependencies
 */
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../use-display-block-controls';
import groups from './groups';

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

	const isDisplayed = useDisplayBlockControls();
	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}
	if ( ! isDisplayed ) {
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

function ToolsPanelInspectorControl( { children, resetAllFilter, fillProps } ) {
	const { registerResetAllFilter, deregisterResetAllFilter } = fillProps;
	useEffect( () => {
		if ( resetAllFilter && registerResetAllFilter ) {
			registerResetAllFilter( resetAllFilter );
		}
		return () => {
			if ( resetAllFilter && deregisterResetAllFilter ) {
				deregisterResetAllFilter( resetAllFilter );
			}
		};
	}, [ resetAllFilter, registerResetAllFilter, deregisterResetAllFilter ] );

	// `fillProps.forwardedContext` is an array of context provider entries, provided by slot,
	// that should wrap the fill markup.
	const { forwardedContext = [] } = fillProps;

	// Children passed to InspectorControlsFill will not have
	// access to any React Context whose Provider is part of
	// the InspectorControlsSlot tree. So we re-create the
	// Provider in this subtree.
	const innerMarkup = <>{ children }</>;
	return forwardedContext.reduce(
		( inner, [ Provider, props ] ) => (
			<Provider { ...props }>{ inner }</Provider>
		),
		innerMarkup
	);
}
