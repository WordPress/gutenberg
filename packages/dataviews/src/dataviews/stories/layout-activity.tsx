/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import {
	trash,
	Icon,
	category,
	envelope,
	payment,
	archive,
	shipping as shippingIcon,
	starFilled,
	check,
	pin,
	link,
} from '@wordpress/icons';
import { Button, __experimentalText as Text } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import { LAYOUT_ACTIVITY } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { Action, Field, View } from '../../types';

export type OrderEvent = {
	id: number;
	name: {
		title: string;
		description: string;
	};
	type: string;
	categories: string[];
	date: string;
	datetime: string;
	email?: string;
	orderNumber: string;
};

// Icon mapping for event types
export const eventTypeIcons: Record< string, any > = {
	status: check,
	payment,
	email: envelope,
	fulfillment: archive,
	shipping: shippingIcon,
	review: starFilled,
};

export const orderEventData: OrderEvent[] = [
	{
		id: 13,
		name: {
			title: 'Customer Review Received',
			description:
				'Customer left a 5-star review: "Great product and fast shipping!"',
		},
		type: 'review',
		categories: [ 'Review', 'Customer' ],
		date: '2025-01-22',
		datetime: '2025-01-22T19:45:33Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 1,
		name: {
			title: 'Order Created',
			description: 'Order #2502 was created.',
		},
		type: 'status',
		categories: [ 'Order', 'Status' ],
		date: '2025-01-15',
		datetime: '2025-01-15T09:23:15Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 2,
		name: {
			title: 'Payment Received',
			description: 'Payment through Credit Card accepted.',
		},
		type: 'payment',
		categories: [ 'Payment', 'Credit Card' ],
		date: '2025-01-15',
		datetime: '2025-01-15T09:23:47Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 3,
		name: {
			title: 'Order Confirmation Sent',
			description:
				'Order confirmation #1259 sent to buzz.lightyear@fictional-store.test',
		},
		type: 'email',
		categories: [ 'Email', 'Communication' ],
		date: '2025-01-15',
		datetime: '2025-01-15T09:24:02Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 4,
		name: {
			title: 'Private Note Added',
			description:
				'Buyer has requested to wait a couple days to send the order, they are not going to be home until the weekend.',
		},
		type: 'note',
		categories: [ 'Note', 'Internal' ],
		date: '2025-01-15',
		datetime: '2025-01-15T14:32:18Z',
		email: 'store.admin@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 5,
		name: {
			title: 'Status Changed to Processing',
			description:
				'Order status automatically changed from pending to processing.',
		},
		type: 'status',
		categories: [ 'Order', 'Status' ],
		date: '2025-01-15',
		datetime: '2025-01-15T14:35:00Z',
		orderNumber: '#2502',
	},
	{
		id: 6,
		name: {
			title: 'Customer Note Added',
			description:
				'Customer added note: "Please leave the package at the back door. Thank you!"',
		},
		type: 'note',
		categories: [ 'Note', 'Customer' ],
		date: '2025-01-16',
		datetime: '2025-01-16T08:15:42Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 7,
		name: {
			title: 'Items Packed',
			description:
				'All items have been packed and are ready for shipment.',
		},
		type: 'fulfillment',
		categories: [ 'Fulfillment', 'Warehouse' ],
		date: '2025-01-18',
		datetime: '2025-01-18T10:22:33Z',
		orderNumber: '#2502',
	},
	{
		id: 8,
		name: {
			title: 'Shipping Label Created',
			description:
				'Shipping label created with USPS Priority Mail. Tracking #9400111899562854217803',
		},
		type: 'shipping',
		categories: [ 'Shipping', 'USPS' ],
		date: '2025-01-18',
		datetime: '2025-01-18T11:05:14Z',
		orderNumber: '#2502',
	},
	{
		id: 9,
		name: {
			title: 'Order Shipped',
			description:
				'Order has been shipped via USPS Priority Mail. Expected delivery: Jan 20, 2025',
		},
		type: 'shipping',
		categories: [ 'Shipping', 'Status' ],
		date: '2025-01-18',
		datetime: '2025-01-18T16:42:09Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 10,
		name: {
			title: 'Shipment Notification Sent',
			description:
				'Shipment notification email with tracking information sent to customer.',
		},
		type: 'email',
		categories: [ 'Email', 'Communication' ],
		date: '2025-01-18',
		datetime: '2025-01-18T16:42:25Z',
		email: 'buzz.lightyear@fictional-store.test',
		orderNumber: '#2502',
	},
	{
		id: 11,
		name: {
			title: 'Package Out for Delivery',
			description:
				'Package is out for delivery with carrier. Delivery expected today.',
		},
		type: 'shipping',
		categories: [ 'Shipping', 'Tracking' ],
		date: '2025-01-20',
		datetime: '2025-01-20T08:15:00Z',
		orderNumber: '#2502',
	},
	{
		id: 12,
		name: {
			title: 'Order Delivered',
			description: 'Order successfully delivered and left at back door.',
		},
		type: 'status',
		categories: [ 'Order', 'Status', 'Delivered' ],
		date: '2025-01-20',
		datetime: '2025-01-20T14:32:51Z',
		orderNumber: '#2502',
	},
	{
		id: 14,
		name: {
			title: 'Order Created',
			description: 'Order #2503 was created.',
		},
		type: 'status',
		categories: [ 'Order', 'Status' ],
		date: '2025-01-16',
		datetime: '2025-01-16T10:15:30Z',
		email: 'woody.pride@fictional-store.test',
		orderNumber: '#2503',
	},
	{
		id: 15,
		name: {
			title: 'Payment Received',
			description: 'Payment through PayPal accepted.',
		},
		type: 'payment',
		categories: [ 'Payment', 'PayPal' ],
		date: '2025-01-16',
		datetime: '2025-01-16T10:16:05Z',
		email: 'woody.pride@fictional-store.test',
		orderNumber: '#2503',
	},
	{
		id: 16,
		name: {
			title: 'Order Confirmation Sent',
			description:
				'Order confirmation #1260 sent to woody.pride@fictional-store.test',
		},
		type: 'email',
		categories: [ 'Email', 'Communication' ],
		date: '2025-01-16',
		datetime: '2025-01-16T10:16:18Z',
		email: 'woody.pride@fictional-store.test',
		orderNumber: '#2503',
	},
	{
		id: 17,
		name: {
			title: 'Order Created',
			description: 'Order #2501 was created.',
		},
		type: 'status',
		categories: [ 'Order', 'Status' ],
		date: '2025-01-14',
		datetime: '2025-01-14T14:22:45Z',
		email: 'rex.green@fictional-store.test',
		orderNumber: '#2501',
	},
	{
		id: 18,
		name: {
			title: 'Payment Received',
			description: 'Payment through Stripe accepted.',
		},
		type: 'payment',
		categories: [ 'Payment', 'Stripe' ],
		date: '2025-01-14',
		datetime: '2025-01-14T14:23:12Z',
		email: 'rex.green@fictional-store.test',
		orderNumber: '#2501',
	},
	{
		id: 19,
		name: {
			title: 'Order Shipped',
			description:
				'Order has been shipped via FedEx Ground. Expected delivery: Jan 18, 2025',
		},
		type: 'shipping',
		categories: [ 'Shipping', 'Status' ],
		date: '2025-01-15',
		datetime: '2025-01-15T11:30:00Z',
		email: 'rex.green@fictional-store.test',
		orderNumber: '#2501',
	},
	{
		id: 20,
		name: {
			title: 'Order Delivered',
			description: 'Order successfully delivered and signed for.',
		},
		type: 'status',
		categories: [ 'Order', 'Status', 'Delivered' ],
		date: '2025-01-18',
		datetime: '2025-01-18T13:45:22Z',
		orderNumber: '#2501',
	},
	{
		id: 21,
		name: {
			title: 'Order Created',
			description: 'Order #2504 was created.',
		},
		type: 'status',
		categories: [ 'Order', 'Status' ],
		date: '2025-01-17',
		datetime: '2025-01-17T16:40:15Z',
		email: 'jessie.cowgirl@fictional-store.test',
		orderNumber: '#2504',
	},
	{
		id: 22,
		name: {
			title: 'Payment Received',
			description: 'Payment through Apple Pay accepted.',
		},
		type: 'payment',
		categories: [ 'Payment', 'Apple Pay' ],
		date: '2025-01-17',
		datetime: '2025-01-17T16:40:42Z',
		email: 'jessie.cowgirl@fictional-store.test',
		orderNumber: '#2504',
	},
	{
		id: 23,
		name: {
			title: 'Private Note Added',
			description:
				'Customer requested gift wrapping with a personalized note.',
		},
		type: 'note',
		categories: [ 'Note', 'Internal' ],
		date: '2025-01-17',
		datetime: '2025-01-17T17:15:00Z',
		email: 'store.admin@fictional-store.test',
		orderNumber: '#2504',
	},
];

export const orderEventFields: Field< OrderEvent >[] = [
	{
		label: 'Icon',
		id: 'icon',
		type: 'media',
		render: ( { item } ) => (
			<Icon icon={ eventTypeIcons[ item.type ] || pin } />
		),
		enableSorting: false,
	},
	{
		label: 'Order',
		id: 'orderNumber',
		type: 'text',
		enableHiding: true,
		enableSorting: false,
	},
	{
		label: 'Title',
		id: 'title',
		type: 'text',
		enableHiding: true,
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.name.title,
		enableSorting: false,
		filterBy: {
			operators: [ 'contains', 'notContains', 'startsWith' ],
		},
	},
	{
		label: 'Description',
		id: 'description',
		type: 'text',
		enableSorting: false,
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.name.description,
		filterBy: {
			operators: [ 'contains', 'notContains', 'startsWith' ],
		},
	},
	{
		id: 'date',
		label: 'Date',
		type: 'date',
		enableSorting: false,
		render: ( { item } ) => {
			return (
				<span>
					{ new Date( item.date ).toLocaleDateString( 'en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					} ) }
				</span>
			);
		},
	},
	{
		id: 'time',
		label: 'Time',
		type: 'datetime',
		enableSorting: false,
		getValue: ( { item } ) => item.datetime,
		render: ( { item } ) => {
			return (
				<span>
					{ new Date( item.datetime ).toLocaleTimeString( 'en-US', {
						hour: 'numeric',
						minute: '2-digit',
						hour12: true,
					} ) }
				</span>
			);
		},
	},
	{
		id: 'datetime',
		label: 'Datetime',
		type: 'datetime',
		enableSorting: false,
		render: ( { item } ) => {
			return (
				<span>
					{ new Date( item.datetime ).toLocaleDateString( 'en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					} ) }{ ' ' }
					{ new Date( item.datetime ).toLocaleTimeString( 'en-US', {
						hour: 'numeric',
						minute: '2-digit',
						hour12: true,
					} ) }
				</span>
			);
		},
	},
	{
		label: 'Type',
		id: 'type',
		enableHiding: false,
		enableSorting: false,
		elements: [
			{ value: 'status', label: 'Status' },
			{ value: 'payment', label: 'Payment' },
			{ value: 'email', label: 'Email' },
			{ value: 'note', label: 'Note' },
			{ value: 'fulfillment', label: 'Fulfillment' },
			{ value: 'shipping', label: 'Shipping' },
			{ value: 'review', label: 'Review' },
		],
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
	},
	{
		label: 'Email',
		id: 'email',
		type: 'email',
		enableSorting: false,
	},
	{
		label: 'Categories',
		id: 'categories',
		header: (
			<Stack direction="row" gap="sm" justify="start" align="center">
				<Icon icon={ category } />
				<span style={ { minWidth: 0 } }>Categories</span>
			</Stack>
		),
		elements: [
			{ value: 'Order', label: 'Order' },
			{ value: 'Status', label: 'Status' },
			{ value: 'Payment', label: 'Payment' },
			{ value: 'Credit Card', label: 'Credit Card' },
			{ value: 'Email', label: 'Email' },
			{ value: 'Communication', label: 'Communication' },
			{ value: 'Note', label: 'Note' },
			{ value: 'Internal', label: 'Internal' },
			{ value: 'Customer', label: 'Customer' },
			{ value: 'Fulfillment', label: 'Fulfillment' },
			{ value: 'Warehouse', label: 'Warehouse' },
			{ value: 'Shipping', label: 'Shipping' },
			{ value: 'USPS', label: 'USPS' },
			{ value: 'Tracking', label: 'Tracking' },
			{ value: 'Delivered', label: 'Delivered' },
			{ value: 'Review', label: 'Review' },
		],
		type: 'array',
		enableGlobalSearch: true,
		enableSorting: false,
	},
];

export const orderEventActions: Action< OrderEvent >[] = [
	{
		id: 'view-note',
		label: 'View Item',
		isPrimary: true,
		icon: link,
		isEligible: ( item ) => item.type === 'note',
		callback: ( items ) => {
			const item = items[ 0 ];
			// eslint-disable-next-line no-alert
			alert(
				`View item: "${ item.name.title }"\n\n${ item.name.description }`
			);
		},
	},
	{
		id: 'delete-note',
		label: 'Delete Note',
		isPrimary: false,
		icon: trash,
		isEligible: ( item ) => item.type === 'note',
		modalHeader: ( items ) =>
			items.length > 1
				? `Delete ${ items.length } items`
				: `Delete ${ items[ 0 ].name.title }`,
		modalFocusOnMount: 'firstContentElement',
		supportsBulk: true,
		RenderModal: ( { items, closeModal } ) => {
			const label =
				items.length > 1
					? `Are you sure you want to delete ${ items.length } items?`
					: `Are you sure you want to delete "${ items[ 0 ].name.title }"?`;
			const onSubmit = () => {
				const item = items[ 0 ];
				// eslint-disable-next-line no-alert
				alert(
					`Delete note: "${ item.name.title }"\n\n${ item.name.description }`
				);
				closeModal?.();
			};
			return (
				<Stack direction="column" gap="xl">
					<Text>{ label }</Text>
					<Stack direction="row" gap="sm" justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ closeModal }
						>
							Cancel
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ onSubmit }
						>
							Delete
						</Button>
					</Stack>
				</Stack>
			);
		},
	},
];

const LayoutActivityComponent = ( {
	backgroundColor,
	hasClickableItems = true,
	groupBy = true,
	groupByLabel = true,
	perPageSizes = [ 10, 25, 50, 100 ],
	showMedia = true,
}: {
	backgroundColor?: string;
	hasClickableItems?: boolean;
	groupBy?: boolean;
	groupByLabel?: boolean;
	perPageSizes?: number[];
	showMedia?: boolean;
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_ACTIVITY,
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'time', 'categories', 'orderNumber' ],
		titleField: 'title',
		descriptionField: 'description',
		mediaField: 'icon',
		showMedia,
		sort: {
			field: 'datetime',
			direction: 'asc',
		},
		groupBy: groupBy
			? {
					field: 'date',
					direction: 'asc',
					showLabel: groupByLabel,
			  }
			: undefined,
	} );
	useEffect( () => {
		setView( ( prevView ) => {
			return {
				...prevView,
				groupBy: groupBy
					? {
							field: 'date',
							direction: 'asc',
							showLabel: groupByLabel,
					  }
					: undefined,
				showMedia,
			};
		} );
	}, [ showMedia, groupBy, groupByLabel ] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( orderEventData, view, orderEventFields );
	}, [ view ] );

	return (
		<div
			style={
				{
					'--wp-dataviews-color-background': backgroundColor,
				} as React.CSSProperties
			}
		>
			<DataViews
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ orderEventFields }
				onChangeView={ setView }
				actions={ orderEventActions }
				isItemClickable={ () => hasClickableItems }
				defaultLayouts={ {
					[ LAYOUT_ACTIVITY ]: {
						sort: {
							field: 'datetime',
							direction: 'asc',
						},
					},
				} }
				config={ { perPageSizes } }
			/>
		</div>
	);
};

export default LayoutActivityComponent;
