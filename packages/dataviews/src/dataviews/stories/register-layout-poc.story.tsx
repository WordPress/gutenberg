/**
 * External dependencies
 */
import type { Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { FormToggle } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DataViews from '..';
import {
	registerLayout,
	getRegisteredLayout,
} from '../../components/dataviews-layouts/registry';
import type { Field, View, ViewBaseProps } from '../../types';

/**
 * Fixture that mirrors the shape of a settings-page "payment methods" row:
 * title + description on the left, a status badge and a toggle control on
 * the right. Chosen to resemble the real-world case that motivated this
 * POC (see docs/plans/2026-04-16-dataviews-register-layout-design.md).
 */
type PaymentMethod = {
	id: string;
	title: string;
	description: string;
	enabled: boolean;
};

const methods: PaymentMethod[] = [
	{
		id: 'bacs',
		title: 'Bank transfer',
		description: 'Accept payments via direct bank transfer.',
		enabled: true,
	},
	{
		id: 'cheque',
		title: 'Check',
		description: 'Accept payments via mailed checks.',
		enabled: false,
	},
	{
		id: 'cod',
		title: 'Cash on delivery',
		description: 'Let customers pay when they receive the order.',
		enabled: true,
	},
];

const methodFields: Field< PaymentMethod >[] = [
	{
		id: 'title',
		label: 'Payment method',
		type: 'text' as const,
		render: ( { item } ) => (
			<div>
				<div style={ { fontWeight: 500 } }>{ item.title }</div>
				<div style={ { color: '#777', fontSize: 13 } }>
					{ item.description }
				</div>
			</div>
		),
	},
	{
		id: 'actions',
		label: 'Actions',
		type: 'text' as const,
		render: ( { item } ) => (
			<FormToggle
				checked={ item.enabled }
				aria-label={ `Enable ${ item.title }` }
				onChange={ () => {} }
			/>
		),
	},
];

/**
 * The plugin-defined layout component. It is a plain function component of
 * shape `( props: ViewBaseProps< Item > ) => ReactElement`. It renders each
 * item as a flex row with the primary field on the left and the secondary
 * field(s) on the right — no table headers, no borders between rows.
 *
 * Accessibility: each row is labelled by the primary cell's content via
 * `aria-labelledby`, so assistive tech still gets meaningful row context
 * even though the visual table header is gone.
 */
function PocCardRowsLayout( {
	data,
	fields,
	getItemId,
	view,
}: ViewBaseProps< PaymentMethod > ) {
	const visibleFieldIds = view.fields ?? fields.map( ( f ) => f.id );
	const primaryId = visibleFieldIds[ 0 ];
	const secondaryIds = visibleFieldIds.slice( 1 );

	return (
		<ul
			style={ {
				listStyle: 'none',
				margin: 0,
				padding: 0,
				display: 'flex',
				flexDirection: 'column',
			} }
		>
			{ data.map( ( item, index ) => {
				const id = getItemId( item );
				const primary = fields.find( ( f ) => f.id === primaryId );
				const primaryLabelId = `poc-row-${ id }-primary`;
				return (
					<li
						key={ id }
						aria-labelledby={ primaryLabelId }
						style={ {
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: 16,
							// Mirror the table layout: a top border on every
							// row except the first. $gray-100 = #f0f0f0.
							borderTop:
								index === 0 ? 'none' : '1px solid #f0f0f0',
							padding: '12px 0',
						} }
					>
						<div id={ primaryLabelId } style={ { flex: 1 } }>
							{ primary && (
								<primary.render
									item={ item }
									field={ primary }
								/>
							) }
						</div>
						<div
							style={ {
								display: 'flex',
								alignItems: 'center',
								gap: 12,
							} }
						>
							{ secondaryIds.map( ( fieldId ) => {
								const f = fields.find(
									( fld ) => fld.id === fieldId
								);
								if ( ! f ) {
									return null;
								}
								return (
									<div key={ fieldId }>
										<f.render item={ item } field={ f } />
									</div>
								);
							} ) }
						</div>
					</li>
				);
			} ) }
		</ul>
	);
}

// Register once at module load. Guarded against duplicate registration so
// Storybook HMR doesn't throw on re-evaluation.
if ( ! getRegisteredLayout( 'pocCardRows' ) ) {
	registerLayout( {
		type: 'pocCardRows',
		label: 'POC card rows',
		component: PocCardRowsLayout as Parameters<
			typeof registerLayout
		>[ 0 ][ 'component' ],
	} );
}

const meta: Meta< typeof DataViews > = {
	title: 'DataViews/Register Layout (POC)',
	component: DataViews,
	parameters: { layout: 'fullscreen' },
	decorators: [
		( Story ) => (
			<div style={ { maxWidth: 660, margin: '1rem auto' } }>
				<h2 style={ { margin: '0 0 8px' } }>
					Offline payment methods
				</h2>
				<p
					style={ {
						margin: '0 0 16px',
						color: '#555',
						fontSize: 14,
					} }
				>
					Custom layout registered via <code>registerLayout()</code>.
					No table headers, no pagination chrome, no column-reorder
					affordances — the layout component decides what to render.
				</p>
				<Story />
			</div>
		),
	],
};

export default meta;

export const PocCardRows = () => {
	const [ view, setView ] = useState< View >( {
		type: 'pocCardRows',
		fields: [ 'title', 'actions' ],
	} as View );

	return (
		<DataViews
			data={ methods }
			fields={ methodFields }
			view={ view }
			onChangeView={ setView }
			getItemId={ ( item ) => item.id }
			paginationInfo={ {
				totalItems: methods.length,
				totalPages: 1,
			} }
			defaultLayouts={ {} }
			search={ false }
		>
			<DataViews.Layout />
		</DataViews>
	);
};
