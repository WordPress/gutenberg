/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { Layout, RowLayout } from '../types';
import FormRegularField from './regular';
import FormPanelField from './panel';
import FormCardField from './card';
import FormRowField from './row';

const FORM_FIELD_LAYOUTS = [
	{
		type: 'regular',
		component: FormRegularField,
	},
	{
		type: 'panel',
		component: FormPanelField,
		wrapper: ( { children }: { children: React.ReactNode } ) => (
			<VStack spacing={ 2 }>{ children }</VStack>
		),
	},
	{
		type: 'card',
		component: FormCardField,
	},
	{
		type: 'row',
		component: FormRowField,
		wrapper: ( {
			children,
			layout,
		}: {
			children: React.ReactNode;
			layout: Layout;
		} ) => (
			<VStack spacing={ 4 }>
				<div className="dataforms-layouts-row__field">
					<HStack
						spacing={ 4 }
						alignment={ ( layout as RowLayout ).alignment }
					>
						{ children }
					</HStack>
				</div>
			</VStack>
		),
	},
];

export function getFormFieldLayout( type: string ) {
	return FORM_FIELD_LAYOUTS.find( ( layout ) => layout.type === type );
}
