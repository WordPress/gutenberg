/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	__experimentalToolsPanelContext as ToolsPanelContext,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';
import { useEffect, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	useBlockEditContext,
	mayDisplayControlsKey,
} from '../block-edit/context';
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

	const { clientId, ...context } = useBlockEditContext();

	// Register any clientIds with `contentOnly` controls before the
	// `mayDisplayControls` early return so that parent blocks can know whether
	// child blocks have those controls.
	const { addContentOnlyControlsBlock, removeContentOnlyControlsBlock } =
		unlock( useDispatch( blockEditorStore ) );
	useEffect( () => {
		if ( group === 'contentOnly' ) {
			addContentOnlyControlsBlock( clientId );
		}
		return () => {
			if ( group === 'contentOnly' ) {
				removeContentOnlyControlsBlock( clientId );
			}
		};
	}, [
		clientId,
		group,
		addContentOnlyControlsBlock,
		removeContentOnlyControlsBlock,
	] );

	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
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
