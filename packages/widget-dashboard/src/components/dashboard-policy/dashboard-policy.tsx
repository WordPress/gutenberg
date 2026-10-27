import { createContext, useContext, useMemo } from '@wordpress/element';
import type { ReactNode } from 'react';
import type { CanPerformDashboardOperation } from '../../types';

const PolicyContext = createContext< CanPerformDashboardOperation | null >(
	null
);

interface WidgetDashboardPolicyProps {
	/**
	 * Answers whether the dashboards below may perform an operation.
	 */
	canPerform: CanPerformDashboardOperation;

	/**
	 * Subtree the policy governs.
	 */
	children: ReactNode;
}

/**
 * Governs the dashboards below it. Mount it around one dashboard, a group,
 * or the whole application. Nested policies compose restrictively: an
 * operation is allowed only when every enclosing policy allows it. Without
 * a policy, every operation is allowed.
 *
 * @param {WidgetDashboardPolicyProps} props Component props.
 */
export function WidgetDashboardPolicy( {
	canPerform,
	children,
}: WidgetDashboardPolicyProps ) {
	const parent = useContext( PolicyContext );

	const value = useMemo< CanPerformDashboardOperation >(
		() =>
			parent
				? ( request ) => parent( request ) && canPerform( request )
				: canPerform,
		[ parent, canPerform ]
	);

	return (
		<PolicyContext.Provider value={ value }>
			{ children }
		</PolicyContext.Provider>
	);
}

/**
 * Reads the policy in effect; `null` when none is mounted.
 */
export function useDashboardPolicy(): CanPerformDashboardOperation | null {
	return useContext( PolicyContext );
}
