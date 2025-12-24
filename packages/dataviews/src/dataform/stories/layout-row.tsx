/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';

const LayoutRowComponent = ( {
	alignment,
}: {
	alignment: 'start' | 'center' | 'end';
} ) => {
	type Customer = {
		name: string;
		email: string;
		phone: string;
		plan: string;
		shippingAddress: string;
		shippingCity: string;
		shippingPostalCode: string;
		shippingCountry: string;
		billingAddress: string;
		billingCity: string;
		billingPostalCode: string;
		totalOrders: number;
		totalRevenue: number;
		averageOrderValue: number;
		hasVat: boolean;
		hasDiscount: boolean;
		vat: number;
		commission: number;
		cost: number;
		tax: number;
		quantity: number;
		total: number;
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
			id: 'shippingAddress',
			label: 'Shipping Address',
			type: 'text',
		},
		{
			id: 'shippingCity',
			label: 'Shipping City',
			type: 'text',
		},
		{
			id: 'shippingPostalCode',
			label: 'Shipping Postal Code',
			type: 'text',
		},
		{
			id: 'shippingCountry',
			label: 'Shipping Country',
			type: 'text',
		},
		{
			id: 'billingAddress',
			label: 'Billing Address',
			type: 'text',
		},
		{
			id: 'billingCity',
			label: 'Billing City',
			type: 'text',
		},
		{
			id: 'billingPostalCode',
			label: 'Billing Postal Code',
			type: 'text',
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
			id: 'hasDiscount',
			label: 'Has Discount?',
			type: 'boolean',
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
			id: 'renewal',
			label: 'Renewal',
			type: 'text',
			Edit: 'radio',
			elements: [
				{ value: 'weekly', label: 'Weekly' },
				{ value: 'monthly', label: 'Monthly' },
				{ value: 'yearly', label: 'Yearly' },
			],
		},
		{
			id: 'cost',
			label: 'Cost',
			type: 'integer',
			setValue: ( { item, value } ) => ( {
				cost: value,
				total: Number( value ) * item.quantity,
			} ),
		},
		{
			id: 'quantity',
			label: 'Quantity',
			type: 'integer',
			elements: [
				{ value: 1, label: '1' },
				{ value: 2, label: '2' },
				{ value: 3, label: '3' },
				{ value: 4, label: '4' },
				{ value: 5, label: '5' },
				{ value: 6, label: '6' },
				{ value: 7, label: '7' },
				{ value: 8, label: '8' },
				{ value: 9, label: '9' },
				{ value: 10, label: '10' },
			],
			setValue: ( { item, value } ) => ( {
				quantity: Number( value ),
				total: Number( value ) * item.cost,
			} ),
		},
		{
			id: 'total',
			label: 'Total',
			type: 'integer',
			readOnly: true,
		},
	];

	const [ customer, setCustomer ] = useState< Customer >( {
		name: 'Danyka Romaguera',
		email: 'aromaguera@example.org',
		phone: '1-828-352-1250',
		plan: 'Business',
		shippingAddress: 'N/A',
		shippingCity: 'N/A',
		shippingPostalCode: 'N/A',
		shippingCountry: 'N/A',
		billingAddress: 'Danyka Romaguera, West Myrtiehaven, 80240-4282, BI',
		billingCity: 'City',
		billingPostalCode: 'PC',
		totalOrders: 2,
		totalRevenue: 1430,
		averageOrderValue: 715,
		hasVat: true,
		vat: 10,
		commission: 5,
		hasDiscount: true,
		cost: 100,
		tax: 20,
		quantity: 5,
		total: 600,
	} );

	const form: Form = useMemo(
		() => ( {
			fields: [
				{
					id: 'customer',
					label: 'Customer',
					layout: {
						type: 'row',
						alignment,
					},
					children: [ 'name', 'phone', 'email' ],
				},
				{
					id: 'addressRow',
					label: 'Billing & Shipping Addresses',
					layout: {
						type: 'row',
						alignment,
					},
					children: [
						{
							id: 'billingAddress',
							children: [
								'billingAddress',
								'billingCity',
								'billingPostalCode',
							],
						},
						{
							id: 'shippingAddress',
							children: [
								'shippingAddress',
								'shippingCity',
								'shippingPostalCode',
								'shippingCountry',
							],
						},
					],
				},
				{
					id: 'payments-and-tax',
					label: 'Payments & Taxes',
					layout: {
						type: 'row',
						alignment,
					},
					children: [ 'vat', 'commission', 'hasDiscount' ],
				},
				{
					id: 'planRow',
					label: 'Subscription',
					layout: {
						type: 'row',
						alignment,
					},
					children: [ 'plan', 'renewal' ],
				},
			],
		} ),
		[ alignment ]
	);

	const topLevelLayout: Form = useMemo(
		() => ( {
			layout: {
				type: 'row',
				alignment,
			},
			fields: [ 'name', 'phone', 'email' ],
		} ),
		[ alignment ]
	);

	return (
		<>
			<h1>Row Layout</h1>
			<h2>As top-level layout</h2>
			<DataForm
				data={ customer }
				fields={ customerFields }
				form={ topLevelLayout }
				onChange={ ( edits ) =>
					setCustomer( ( prev ) => ( {
						...prev,
						...edits,
					} ) )
				}
			/>
			<h2>Per field layout</h2>
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
			<h2>Field widths</h2>
			<DataForm
				data={ customer }
				fields={ customerFields }
				form={ {
					fields: [
						{
							id: 'product',
							label: 'Product',
							layout: {
								type: 'row',
								alignment: 'end',
								styles: {
									total: { flex: 1 },
									cost: { flex: 3 },
									quantity: { flex: 3 },
								},
							},
							children: [ 'total', 'cost', 'quantity' ],
						},
					],
				} }
				onChange={ ( edits ) =>
					setCustomer( ( prev ) => ( {
						...prev,
						...edits,
					} ) )
				}
			/>
		</>
	);
};

export default LayoutRowComponent;
