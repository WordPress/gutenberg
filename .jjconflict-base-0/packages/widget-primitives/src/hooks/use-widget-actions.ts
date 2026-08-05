import { useId, useLayoutEffect, useMemo, useRef } from '@wordpress/element';
import { useWidgetHost } from '../widget-host';
import { useWidgetActionsCollector } from '../widget-host/widget-actions-collector';
import type { WidgetRuntimeAction } from '../types';

const NO_ACTIONS: WidgetRuntimeAction[] = [];

/*
 * Callbacks always match: the host runs the latest one.
 */
function isSameAction(
	a: WidgetRuntimeAction,
	b: WidgetRuntimeAction
): boolean {
	const left = a as unknown as Record< string, unknown >;
	const right = b as unknown as Record< string, unknown >;
	const keys = Object.keys( left );

	return (
		keys.length === Object.keys( right ).length &&
		keys.every(
			( key ) =>
				Object.is( left[ key ], right[ key ] ) ||
				( typeof left[ key ] === 'function' &&
					typeof right[ key ] === 'function' )
		)
	);
}

function isSameList(
	a: WidgetRuntimeAction[],
	b: WidgetRuntimeAction[]
): boolean {
	return (
		a.length === b.length &&
		a.every( ( action, index ) => isSameAction( action, b[ index ] ) )
	);
}

/**
 * Declares the actions a mounted widget wants its host to place. The list
 * is this call's whole set: leave out what does not apply. Calls from
 * several components of one widget compose. The list is compared by value,
 * so it can be written inline, and a callback always runs its latest
 * version.
 *
 * @param {WidgetRuntimeAction[]} actions The actions to place.
 * @return {boolean} Whether the host places them.
 */
export function useWidgetActions( actions: WidgetRuntimeAction[] ): boolean {
	const hostDeclare = useWidgetHost().actions?.declare;
	const collector = useWidgetActionsCollector();
	const callId = useId();
	// Under `WidgetRender` every call declares through the collector, which
	// hands the host one list; elsewhere the last call wins.
	const declare = useMemo(
		() =>
			collector
				? ( next: WidgetRuntimeAction[] ) =>
						collector.declare( callId, next )
				: hostDeclare,
		[ collector, hostDeclare, callId ]
	);
	const latestRef = useRef( actions );
	const declaredRef = useRef< WidgetRuntimeAction[] | null >( null );

	// Layout effect, so the host paints the actions with the same frame.
	useLayoutEffect( () => {
		latestRef.current = actions;

		if (
			! declare ||
			( declaredRef.current &&
				isSameList( declaredRef.current, actions ) )
		) {
			return;
		}

		declaredRef.current = actions;
		declare(
			actions.map( ( action ) => {
				if ( ! ( 'callback' in action ) ) {
					return action;
				}

				return {
					...action,
					callback: () => {
						const current = latestRef.current.find(
							( { id } ) => id === action.id
						);

						return current && 'callback' in current
							? current.callback()
							: undefined;
					},
				};
			} )
		);
	} );

	useLayoutEffect(
		() => () => {
			declaredRef.current = null;
			declare?.( NO_ACTIONS );
		},
		[ declare ]
	);

	return collector ? collector.hosted : !! hostDeclare;
}
