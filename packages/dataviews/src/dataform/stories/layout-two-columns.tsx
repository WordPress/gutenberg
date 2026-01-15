/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';

const LayoutTwoColumnsComponent: React.FC = () => {
	type Fields = {
		enable_taxes: boolean;
		enable_coupons: boolean;
		subscription_type: string;
		renewal_period: string;
		payment_method: string;
	};

	const fields: Field< Fields >[] = [
		{
			id: 'enable_taxes',
			label: 'Enable taxes for your products',
			description:
				'Enable taxes for your products to be calculated and displayed in the checkout process.',
			type: 'boolean',
		},
		{
			id: 'enable_coupons',
			label: 'Enable coupons',
			description:
				'Enable coupons for your products to be used in the checkout process.',
			type: 'boolean',
		},
		{
			id: 'subscription_type',
			label: 'Subscription Type',
			type: 'text',
			Edit: 'toggleGroup',
			elements: [
				{ value: 'monthly', label: 'Monthly' },
				{ value: 'yearly', label: 'Yearly' },
				{ value: 'lifetime', label: 'Lifetime' },
			],
		},
		{
			id: 'renewal_period',
			label: 'Renewal Period',
			type: 'text',
			Edit: 'toggleGroup',
			elements: [
				{ value: '30', label: '30 days' },
				{ value: '60', label: '60 days' },
				{ value: '90', label: '90 days' },
			],
		},
		{
			id: 'payment_method',
			label: 'Payment Method',
			type: 'text',
			Edit: 'radio',
			elements: [
				{ value: 'credit-card', label: 'Credit Card' },
				{ value: 'paypal', label: 'PayPal' },
				{ value: 'bank-transfer', label: 'Bank Transfer' },
			],
		},
	];

	const [ settings, setSettings ] = useState< Fields >( {
		enable_taxes: false,
		enable_coupons: false,
		subscription_type: 'monthly',
		renewal_period: '30',
		payment_method: 'credit-card',
	} );

	const form: Form = useMemo(
		() => ( {
			layout: { type: 'two-columns' },
			fields: [
				{
					id: 'taxes-coupons',
					label: 'Taxes & Coupons',
					description:
						'Configure taxes and coupons for your products.',
					layout: {
						type: 'two-columns',
					},
					children: [
						{
							id: 'enable_taxes',
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
						},
						{
							id: 'enable_coupons',
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
						},
					],
				},
				{
					id: 'subscriptionSettings',
					label: 'Subscription Settings',
					description:
						'Configure subscription type, renewal period, and payment methods.',
					layout: {
						type: 'two-columns',
					},
					children: [
						{
							id: 'subscription_type',
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
						},
						{
							id: 'renewal_period',
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
						},
						{
							id: 'payment_method',
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
						},
					],
				},
			],
		} ),
		[]
	);

	return (
		<DataForm
			data={ settings }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setSettings( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

export default LayoutTwoColumnsComponent;
