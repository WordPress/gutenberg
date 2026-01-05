/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { privateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( privateApis );

const LayoutCardComponent = ( {
	withHeader,
	withSummary,
	isCollapsible,
	isOpened,
}: {
	withHeader: boolean;
	withSummary: boolean;
	isCollapsible: boolean;
	isOpened?: boolean;
} ) => {
	type Customer = {
		name: string;
		email: string;
		phone: string;
		plan: string;
		shippingAddress: string;
		billingAddress: string;
		displayPayments: boolean;
		totalOrders: number;
		totalRevenue: number;
		averageOrderValue: number;
		hasVat: boolean;
		vat: number;
		commission: number;
		dueDate: string;
	};

	const customerFields: Field< Customer >[] = [
		{
			id: 'name',
			label: 'Customer Name',
			type: 'text',
		},
		{
			id: 'phone',
			label: 'Phone',
			type: 'text',
		},
		{
			id: 'email',
			label: 'Email',
			type: 'email',
		},
		{
			id: 'plan',
			label: 'Plan',
			type: 'text',
			Edit: 'toggleGroup',
			elements: [
				{ value: 'basic', label: 'Basic' },
				{ value: 'business', label: 'Business' },
				{ value: 'vip', label: 'VIP' },
			],
		},
		{
			id: 'shippingAddress',
			label: 'Shipping Address',
			type: 'text',
		},
		{
			id: 'billingAddress',
			label: 'Billing Address',
			type: 'text',
		},
		{
			id: 'displayPayments',
			label: 'Display Payments?',
			type: 'boolean',
		},
		{
			id: 'payments',
			label: 'Payments',
			type: 'text',
			readOnly: true, // Triggers using the render method instead of Edit.
			isVisible: ( item ) => item.displayPayments,
			render: ( { item } ) => {
				return (
					<p style={ { margin: 0 } }>
						The customer has made a total of { item.totalOrders }{ ' ' }
						orders, amounting to { item.totalRevenue } dollars. The
						average order value is { item.averageOrderValue }{ ' ' }
						dollars.
					</p>
				);
			},
		},
		{
			id: 'vat',
			label: 'VAT',
			type: 'integer',
		},
		{
			id: 'commission',
			label: 'Commission',
			type: 'integer',
		},
		{
			id: 'dueDate',
			label: 'Due Date',
			type: 'text',
			render: ( { item } ) => {
				return <Badge>Due on: { item.dueDate }</Badge>;
			},
		},
		{
			id: 'plan-summary',
			type: 'text',
			readOnly: true,
			render: ( { item } ) => {
				return <Badge>{ item.plan }</Badge>;
			},
		},
	];

	const [ customer, setCustomer ] = useState< Customer >( {
		name: 'Danyka Romaguera',
		email: 'aromaguera@example.org',
		phone: '1-828-352-1250',
		plan: 'Business',
		shippingAddress: 'N/A',
		billingAddress: 'Danyka Romaguera, West Myrtiehaven, 80240-4282, BI',
		displayPayments: true,
		totalOrders: 2,
		totalRevenue: 1430,
		averageOrderValue: 715,
		hasVat: true,
		vat: 10,
		commission: 5,
		dueDate: 'March 1st, 2028',
	} );

	const getCardLayoutFromStoryArgs = ( {
		summary,
		withSummary: displaySummary,
		withHeader: header,
		isCollapsible: collapsible,
		isOpened: opened,
	}: {
		summary?: string | { id: string; visibility: 'always' }[];
		withSummary?: boolean;
		withHeader?: boolean;
		isCollapsible?: boolean;
		isOpened?: boolean;
	} ) => {
		return {
			type: 'card' as const,
			summary: displaySummary ? summary : undefined,
			...( header === false
				? { withHeader: false as const }
				: {
						withHeader: true as const,
						isCollapsible: collapsible,
						isOpened: opened,
				  } ),
		};
	};

	const form: Form = useMemo(
		() => ( {
			layout: { type: 'card' },
			fields: [
				{
					id: 'customerCard',
					layout: getCardLayoutFromStoryArgs( {
						summary: 'plan-summary',
						withHeader: withHeader ?? true,
						withSummary,
						isCollapsible,
						isOpened,
					} ),
					label: 'Customer',
					description:
						'Enter your contact details, plan type, and addresses to complete your customer information.',
					children: [
						{
							id: 'customerContact',
							label: 'Contact',
							layout: {
								type: 'panel',
								labelPosition: 'top',
							},
							children: [
								{
									id: 'name',
									layout: {
										type: 'regular',
										labelPosition: 'top',
									},
								},
								{
									id: 'phone',
									layout: {
										type: 'regular',
										labelPosition: 'top',
									},
								},
								{
									id: 'email',
									layout: {
										type: 'regular',
										labelPosition: 'top',
									},
								},
							],
						},
						{
							id: 'plan',
							layout: { type: 'panel', labelPosition: 'top' },
						},
						{
							id: 'shippingAddress',
							layout: { type: 'panel', labelPosition: 'top' },
						},
						{
							id: 'billingAddress',
							layout: { type: 'panel', labelPosition: 'top' },
						},
						'displayPayments',
					],
				},
				{
					id: 'payments',
					layout: getCardLayoutFromStoryArgs( {
						withHeader: false,
					} ),
				},
				{
					id: 'taxConfiguration',
					label: 'Taxes',
					layout: getCardLayoutFromStoryArgs( {
						summary: [ { id: 'dueDate', visibility: 'always' } ],
						withHeader,
						withSummary,
						isCollapsible,
						isOpened: isOpened ?? false,
					} ),
					children: [ 'vat', 'commission' ],
				},
			],
		} ),
		[ withHeader, withSummary, isCollapsible, isOpened ]
	);

	return (
		<DataForm
			data={ customer }
			fields={ customerFields }
			form={ form }
			onChange={ ( edits ) =>
				setCustomer( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

export default LayoutCardComponent;
