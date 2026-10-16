import type { ReactNode } from 'react';
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';
import { useWidgetHost } from './widget-host';
import type { WidgetRuntimeAction } from '../types';

interface WidgetActionsCollectorValue {
	hosted: boolean;
	declare: ( callId: string, actions: WidgetRuntimeAction[] ) => void;
}

const WidgetActionsCollectorContext =
	createContext< WidgetActionsCollectorValue | null >( null );

export function useWidgetActionsCollector(): WidgetActionsCollectorValue | null {
	return useContext( WidgetActionsCollectorContext );
}

/*
 * Calls are joined in the order they first declare; the last declaration of
 * an `id` wins.
 */
function joinDeclarations(
	declarations: Map< string, WidgetRuntimeAction[] >
): WidgetRuntimeAction[] {
	const byId = new Map< string, WidgetRuntimeAction >();
	for ( const actions of declarations.values() ) {
		for ( const action of actions ) {
			byId.set( action.id, action );
		}
	}

	return [ ...byId.values() ];
}

/**
 * Joins what every `useWidgetActions` call under one render declares, so
 * the host always receives the instance's whole list.
 *
 * @param {Object}    props          Component props.
 * @param {ReactNode} props.children The widget's render.
 */
export function WidgetActionsCollector( {
	children,
}: {
	children: ReactNode;
} ): React.ReactNode {
	const hostDeclare = useWidgetHost().actions?.declare;
	const [ declarations ] = useState(
		() => new Map< string, WidgetRuntimeAction[] >()
	);

	const value = useMemo< WidgetActionsCollectorValue >(
		() => ( {
			hosted: !! hostDeclare,
			declare: ( callId, actions ) => {
				if ( actions.length > 0 ) {
					declarations.set( callId, actions );
				} else {
					declarations.delete( callId );
				}
				hostDeclare?.( joinDeclarations( declarations ) );
			},
		} ),
		[ hostDeclare, declarations ]
	);

	return (
		<WidgetActionsCollectorContext.Provider value={ value }>
			{ children }
		</WidgetActionsCollectorContext.Provider>
	);
}
