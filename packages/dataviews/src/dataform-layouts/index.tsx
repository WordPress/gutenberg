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
import type { NormalizedLayout, NormalizedRowLayout } from '../types';
import FormRegularField from './regular';
import FormPanelField from './panel';
import FormCardField from './card';
import FormRowField from './row';
import FormDetailsField from './details';

const FORM_FIELD_LAYOUTS = [
	{
		type: 'regular',
		component: FormRegularField,
		wrapper: ( { children }: { children: React.ReactNode } ) => (
			<VStack className="dataforms-layouts__wrapper" spacing={ 4 }>
				{ children }
			</VStack>
		),
	},
	{
		type: 'panel',
		component: FormPanelField,
		wrapper: ( { children }: { children: React.ReactNode } ) => (
			<VStack className="dataforms-layouts__wrapper" spacing={ 2 }>
				{ children }
			</VStack>
		),
	},
	{
		type: 'card',
		component: FormCardField,
		wrapper: ( { children }: { children: React.ReactNode } ) => (
			<VStack className="dataforms-layouts__wrapper" spacing={ 6 }>
				{ children }
			</VStack>
		),
	},
	{
		type: 'row',
		component: FormRowField,
		wrapper: ( {
			children,
			layout,
		}: {
			children: React.ReactNode;
			layout: NormalizedLayout;
		} ) => (
			<VStack className="dataforms-layouts__wrapper" spacing={ 4 }>
				<div className="dataforms-layouts-row__field">
					<HStack
						spacing={ 4 }
						alignment={
							( layout as NormalizedRowLayout ).alignment
						}
					>
						{ children }
					</HStack>
				</div>
			</VStack>
		),
	},
	{
		type: 'details',
		component: FormDetailsField,
	},
];

export function getFormFieldLayout( type: string ) {
	return FORM_FIELD_LAYOUTS.find( ( layout ) => layout.type === type );
}
