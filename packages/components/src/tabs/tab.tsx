/**
 * WordPress dependencies
 */

import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabProps } from './types';
import warning from '@wordpress/warning';
import { TabsContext } from './context';
import { Tab as StyledTab } from './styles';

function Tab( { children, id, className, disabled, render, style }: TabProps ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;
	const instancedTabId = `${ instanceId }-${ id }`;
	return (
		<StyledTab
			store={ store }
			id={ instancedTabId }
			className={ className }
			style={ style }
			disabled={ disabled }
			render={ render }
		>
			{ children }
		</StyledTab>
	);
}

export default Tab;
