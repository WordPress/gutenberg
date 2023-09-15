/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabProps } from './types';
import Button from '../button';
import warning from '@wordpress/warning';
import { TabsContext } from './context';

function Tab( {
	children,
	id,
	className,
	disabled,
	icon,
	title,
	style,
}: TabProps ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId, activeClass } = context;
	const instancedTabId = `${ instanceId }-${ id }`;
	return (
		<Ariakit.Tab
			store={ store }
			id={ instancedTabId }
			className={ classnames( 'components-tabs__tabs-item', className, {
				[ activeClass ]: instancedTabId === store.useState().activeId,
			} ) }
			style={ style }
			disabled={ disabled }
			render={
				<Button
					icon={ icon }
					label={ icon && title }
					showTooltip={ true }
				/>
			}
		>
			{ children }
		</Ariakit.Tab>
	);
}

export default Tab;
