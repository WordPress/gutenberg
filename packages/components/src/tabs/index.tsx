/**
 * External dependencies
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import cx from 'classnames';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import Button from '../button';
import type {
	TabsProps,
	TabProps,
	TabsListProps,
	TabPanelProps,
} from './types';

export const TabsList = ( { className, children }: TabsListProps ) => (
	<RadixTabs.TabsList
		className={ cx( 'components-tabs__tabs-list', className ) }
	>
		{ children }
	</RadixTabs.TabsList>
);

export const Tab = ( {
	value,
	disabled = false,
	className,
	children,
}: TabProps ) => (
	<RadixTabs.Trigger
		value={ value }
		disabled={ disabled }
		className={ cx( 'components-tabs__tab', className ) }
		asChild
	>
		<Button disabled={ disabled } __experimentalIsFocusable>
			{ children }
		</Button>
	</RadixTabs.Trigger>
);

export const TabPanel = ( { value, className, children }: TabPanelProps ) => (
	<RadixTabs.Content className={ className } value={ value }>
		{ children }
	</RadixTabs.Content>
);

export function Tabs( {
	defaultValue,
	value,
	onValueChange,
	className,
	children,
	orientation = 'horizontal',
}: TabsProps ) {
	return (
		<RadixTabs.Root
			defaultValue={ defaultValue }
			value={ value }
			onValueChange={ onValueChange }
			className={ className }
			orientation={ orientation }
		>
			{ children }
		</RadixTabs.Root>
	);
}
