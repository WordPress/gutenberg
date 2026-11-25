import type { ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import { Tabs } from '@wordpress/ui';
import { OPERATOR_IS } from '../../constants';
import setFieldFilter from '../../utils/set-field-filter';
import DataViewsContext from '../dataviews-context';
import DataViewsLayout from '../dataviews-layout';
import { getActiveOption, getFilterTabsOperator } from './utils';

const ALL = 'all';
const getTabValue = ( index: number ) => `option-${ index }`;

export interface FilterTabsProps {
	/**
	 * The id of the field to show as tabs. The field needs a fixed list of
	 * options (`elements`) and to be filterable by `is` or `isAny`.
	 */
	field: string;

	/**
	 * The label of the tab that shows every item.
	 *
	 * @default "All"
	 */
	allLabel?: string;

	/**
	 * Whether to add a first tab that shows every item, by removing the
	 * field's filter. Without it, the view is expected to always filter by
	 * the field.
	 *
	 * @default true
	 */
	showAll?: boolean;

	/**
	 * The content the tabs switch. Defaults to `<DataViews.Layout />`.
	 */
	children?: ReactNode;
}

/**
 * Shows one filter as a row of minimal tabs above the content: the main way to
 * browse it, such as a category or a type. Choosing a tab filters the view by
 * that option; the "All" tab removes the filter.
 *
 * It renders the layout itself, inside the tab panel, so don't also render
 * `<DataViews.Layout />` next to it.
 */
export default function DataViewsFilterTabs( {
	field,
	allLabel,
	showAll = true,
	children,
}: FilterTabsProps ) {
	const { view, onChangeView, filters, data } =
		useContext( DataViewsContext );
	const content = children ?? <DataViewsLayout />;
	const filter = filters.find( ( { field: id } ) => id === field );
	const operator = filter ? getFilterTabsOperator( filter ) : undefined;
	const elements = filter?.elements ?? [];
	const tabs = [
		...( showAll
			? [ { value: ALL, label: allLabel ?? __( 'All' ) } ]
			: [] ),
		...elements.map( ( element, index ) => ( {
			value: getTabValue( index ),
			label: element.label,
		} ) ),
	];

	// Without a filter the user can change, or with nothing to switch
	// between, there is no tab bar.
	if ( ! filter || ! operator || filter.isLocked || tabs.length < 2 ) {
		return <>{ content }</>;
	}

	const activeOption = getActiveOption( view, field, elements );
	let activeValue: string | null = null;
	if ( activeOption === 'all' ) {
		activeValue = showAll ? ALL : null;
	} else if ( activeOption !== null ) {
		activeValue = getTabValue( activeOption );
	}

	return (
		<Tabs.Root
			className="dataviews-filter-tabs"
			value={ activeValue }
			onValueChange={ ( nextValue, eventDetails ) => {
				// Only follow the user's choice, not the automatic fallbacks
				// `Tabs` makes when the selected tab goes away.
				if ( eventDetails.reason !== 'none' ) {
					return;
				}
				const index = elements.findIndex(
					( _element, i ) => getTabValue( i ) === nextValue
				);
				if ( index === -1 ) {
					onChangeView( setFieldFilter( view, field ) );
					return;
				}
				const { value } = elements[ index ];
				onChangeView(
					setFieldFilter( view, field, {
						operator,
						value: operator === OPERATOR_IS ? value : [ value ],
					} )
				);
			} }
		>
			<div className="dataviews-filter-tabs__list">
				<Tabs.List
					variant="minimal"
					aria-label={ filter.name }
					className="dataviews-filter-tabs__tablist"
				>
					{ tabs.map( ( tab ) => (
						<Tabs.Tab key={ tab.value } value={ tab.value }>
							{ tab.label }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</div>
			{ /*
			 * One panel holds the content and follows the selected tab, so
			 * the layout stays mounted when the tab changes. `Tabs` asks for
			 * one panel per tab, so the other tabs get an empty panel, which
			 * renders nothing while its tab isn't selected.
			 */ }
			{ activeValue !== null && (
				<Tabs.Panel
					key="active"
					value={ activeValue }
					className="dataviews-filter-tabs__panel"
					// With items to focus, Tab goes straight to the first one.
					// The panel is only a stop of its own when it is empty.
					tabIndex={ data.length > 0 ? -1 : undefined }
				>
					{ content }
				</Tabs.Panel>
			) }
			{ tabs
				.filter( ( tab ) => tab.value !== activeValue )
				.map( ( tab ) => (
					<Tabs.Panel key={ tab.value } value={ tab.value } />
				) ) }
			{ /* No tab matches the current filter: show the content as is. */ }
			{ activeValue === null && content }
		</Tabs.Root>
	);
}
