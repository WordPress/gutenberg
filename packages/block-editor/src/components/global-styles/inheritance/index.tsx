import { privateApis as componentsPrivateApis } from '@wordpress/components';
import clsx from 'clsx';
import type { ClassValue } from 'clsx';
import { unlock } from '../../../lock-unlock';
import type { InheritanceToolsPanelItemProps } from './types';

const { ToolsPanelItem } = unlock( componentsPrivateApis );

/**
 * Whether the block inspector lets each style control's visibility follow its
 * inherited Global Styles value.
 *
 * With it on, the inspector's style panels only show controls holding a local
 * or inherited value, the panel menu only adds and removes controls, and a
 * separate reset menu appears while any control holds a local value. The
 * inherited values themselves reach the controls either way. Behind the
 * `gutenberg-global-styles-inheritance-ui` Gutenberg experiment, so this is
 * off unless someone opts in on the Experiments screen.
 *
 * Evaluated per call rather than once at module scope, so tests can toggle
 * the experiment and so a later move to a store-backed setting only has to
 * change this one place. Always returns a boolean: callers pass the result
 * down as a prop, and `undefined` would trigger a receiving component's own
 * default parameter.
 *
 * @return Whether the inheritance UI is enabled.
 */
export const isGlobalStylesInheritanceIndicatorUIEnabled = () =>
	!! ( window as { __experimentalGlobalStylesInheritanceUI?: boolean } )
		.__experimentalGlobalStylesInheritanceUI;

/**
 * Returns props to spread onto a wrapping `<InheritanceToolsPanelItem>` so
 * its `ToolsPanel` knows whether the control holds an inherited Global Styles
 * value, whether or not a local value overrides it.
 *
 *     <InheritanceToolsPanelItem
 *         { ...getInheritanceProps( isInherited, hasLocalOverride ) }
 *         label={ __( 'Line height' ) }
 *         …
 *     >
 *
 * @param isInherited      Control is inheriting at rest.
 * @param hasLocalOverride Local override is set AND there is an inherited
 *                         value being overridden.
 * @param [baseClassName]  Optional className(s) to pass through as the
 *                         returned `className`.
 *
 * @return Props for the wrapping `InheritanceToolsPanelItem`.
 */
export function getInheritanceProps(
	isInherited: unknown,
	hasLocalOverride: unknown,
	baseClassName?: ClassValue
) {
	const className = clsx( baseClassName );
	return {
		...( className ? { className } : {} ),
		isInherited: !! isInherited || !! hasLocalOverride,
	};
}

/**
 * A `ToolsPanelItem` that tells its panel whether the control holds an
 * inherited Global Styles value. In the block inspector, with the experiment
 * on, an inherited control is always shown and can't be removed from the
 * panel menu.
 *
 * @return The panel item.
 */
export function InheritanceToolsPanelItem( {
	isInherited = false,
	children,
	...rest
}: InheritanceToolsPanelItemProps ) {
	return (
		<ToolsPanelItem isInherited={ isInherited } { ...rest }>
			{ children }
		</ToolsPanelItem>
	);
}
