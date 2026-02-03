/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NormalizedLayout, NormalizedRowLayout } from '../../types';
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
			<Stack
				direction="column"
				className="dataforms-layouts__wrapper"
				gap="lg"
			>
				{ children }
			</Stack>
		),
	},
	{
		type: 'panel',
		component: FormPanelField,
		wrapper: ( { children }: { children: React.ReactNode } ) => (
			<Stack
				direction="column"
				className="dataforms-layouts__wrapper"
				gap="sm"
			>
				{ children }
			</Stack>
		),
	},
	{
		type: 'card',
		component: FormCardField,
		wrapper: ( { children }: { children: React.ReactNode } ) => (
			<Stack
				direction="column"
				className="dataforms-layouts__wrapper"
				gap="xl"
			>
				{ children }
			</Stack>
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
			<Stack
				direction="column"
				className="dataforms-layouts__wrapper"
				gap="lg"
			>
				<div className="dataforms-layouts-row__field">
					<Stack
						direction="row"
						gap="lg"
						align={ ( layout as NormalizedRowLayout ).alignment }
					>
						{ children }
					</Stack>
				</div>
			</Stack>
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
