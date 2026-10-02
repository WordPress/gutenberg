import {
	ColorIndicator,
	Modal,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { DataViews, DataViewsPicker } from '@wordpress/dataviews';
import type { ActionButton, Field, View } from '@wordpress/dataviews';
import { __, _n, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';
import { Checkbox, Stack, Tooltip } from '@wordpress/ui';
import { EMPTY_VALUE_LABEL } from './format-style-value';

interface ShownValue {
	formattedValue: string;
	color?: string;
}

export interface StyleSourceRow extends ShownValue {
	id: string;
	path: string[];
	label: string;
	isChanged: boolean;
	source?: string | null;
	replaces?: ( ShownValue & { source: string } ) | null;
}

interface StyleSourcesModalProps {
	name: string;
	rows: StyleSourceRow[];
	variationTitle?: string;
	onReset: ( rows: StyleSourceRow[] ) => void;
	canApply: ( row: StyleSourceRow ) => boolean;
	onApply: ( rows: StyleSourceRow[] ) => void;
	onRequestClose: () => void;
}

const DEFAULT_LAYOUTS = { table: {} };

// Past this many characters a value truncates, with the full value in a tooltip.
const TRUNCATE_LIMIT = 24;

const getItemId = ( row: StyleSourceRow ) => row.id;

function StyleValue( { formattedValue, color }: ShownValue ) {
	const text =
		formattedValue.length > TRUNCATE_LIMIT ? (
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<Truncate limit={ TRUNCATE_LIMIT } ellipsizeMode="tail">
							{ formattedValue }
						</Truncate>
					}
				/>
				<Tooltip.Popup>{ formattedValue }</Tooltip.Popup>
			</Tooltip.Root>
		) : (
			formattedValue
		);
	return (
		<Stack direction="row" gap="sm" align="center">
			{ color && <ColorIndicator colorValue={ color } /> }
			<span className="editor-style-sources-modal__value">{ text }</span>
		</Stack>
	);
}

function EmptyCell() {
	return (
		<span className="editor-style-sources-modal__muted">
			{ EMPTY_VALUE_LABEL }
		</span>
	);
}

// Counts and selects the changed rows only, as the others can't be selected.
function FooterSelection( {
	changedRows,
	selection,
	onChangeSelection,
}: {
	changedRows: StyleSourceRow[];
	selection: string[];
	onChangeSelection: ( selection: string[] ) => void;
} ) {
	const areAllSelected =
		changedRows.length > 0 && selection.length === changedRows.length;
	return (
		<Stack direction="row" gap="md" align="center">
			<Checkbox
				checked={ areAllSelected }
				indeterminate={ ! areAllSelected && selection.length > 0 }
				disabled={ ! changedRows.length }
				onCheckedChange={ () =>
					onChangeSelection(
						areAllSelected ? [] : changedRows.map( getItemId )
					)
				}
				aria-label={
					areAllSelected ? __( 'Deselect all' ) : __( 'Select all' )
				}
			/>
			<span>
				{ sprintf(
					// translators: 1: Number of selected styles. 2: Number of styles changed on the block.
					_n(
						'%1$d of %2$d changed style selected',
						'%1$d of %2$d changed styles selected',
						changedRows.length
					),
					selection.length,
					changedRows.length
				) }
			</span>
		</Stack>
	);
}

const FIELDS: Field< StyleSourceRow >[] = [
	{
		id: 'label',
		label: __( 'Style' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		// Also the row checkbox's label, so a disabled checkbox says why.
		getValue: ( { item } ) =>
			item.isChanged
				? item.label
				: sprintf(
						// translators: %s: Style name e.g. 'Line height'.
						__( '%s, not changed on this block' ),
						item.label
					),
		render: ( { item } ) =>
			item.isChanged ? (
				item.label
			) : (
				<span className="editor-style-sources-modal__inherited-label">
					{ item.label }
				</span>
			),
	},
	{
		id: 'value',
		label: __( 'Current value' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		getValue: ( { item } ) => item.formattedValue,
		render: ( { item } ) => <StyleValue { ...item } />,
	},
	{
		id: 'source',
		label: __( 'Comes from' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		getValue: ( { item } ) =>
			item.isChanged ? __( 'This block' ) : ( item.source ?? '' ),
		render: ( { item } ) =>
			item.isChanged ? (
				<span className="editor-style-sources-modal__this-block">
					{ __( 'This block' ) }
				</span>
			) : (
				<span className="editor-style-sources-modal__muted">
					{ item.source }
				</span>
			),
	},
	{
		id: 'theme-value',
		label: __( 'Theme value' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		getValue: ( { item } ) => item.replaces?.formattedValue ?? '',
		render: ( { item } ) => {
			if ( ! item.isChanged ) {
				return <EmptyCell />;
			}
			// The engine can't see block stylesheet CSS, so say only what is
			// known.
			if ( ! item.replaces ) {
				return (
					<span className="editor-style-sources-modal__muted">
						{ __( 'Not set' ) }
					</span>
				);
			}
			return <StyleValue { ...item.replaces } />;
		},
	},
	{
		id: 'set-in',
		label: __( 'Set in' ),
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
		getValue: ( { item } ) => item.replaces?.source ?? '',
		render: ( { item } ) =>
			item.isChanged && item.replaces ? (
				item.replaces.source
			) : (
				<EmptyCell />
			),
	},
];

/**
 * Modal listing every style a block's controls show, with its value and where
 * that value comes from: this block, or a Global Styles layer.
 *
 * One table, changed rows first. Only changed rows are selectable, and the
 * footer resets or applies the selection globally, like the "Apply globally"
 * modal.
 *
 * @param props                Component props.
 * @param props.name           Block name.
 * @param props.rows           Rows from `useStyleSources`.
 * @param props.variationTitle Active block style variation label.
 * @param props.onReset        Called with the rows to reset.
 * @param props.canApply       Whether a row can be applied globally.
 * @param props.onApply        Called with the rows to apply globally.
 * @param props.onRequestClose Called to close the modal.
 */
export default function StyleSourcesModal( {
	name,
	rows,
	variationTitle,
	onReset,
	canApply,
	onApply,
	onRequestClose,
}: StyleSourcesModalProps ) {
	const changedRows = rows.filter( ( row ) => row.isChanged );
	const sortedRows = [
		...changedRows,
		...rows.filter( ( row ) => ! row.isChanged ),
	];

	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ view, setView ] = useState< View >( () => ( {
		type: 'table',
		titleField: 'label',
		fields: [ 'value', 'source', 'theme-value', 'set-in' ],
		page: 1,
		perPage: 100,
		layout: { enableMoving: false },
	} ) );
	// Drop ids whose rows a reset or apply moved out of the changed rows.
	const currentSelection = selection.filter( ( id ) =>
		changedRows.some( ( row ) => row.id === id )
	);

	// A row with no eligible bulk action gets a disabled checkbox, so only
	// changed rows can be selected.
	const actions: ActionButton< StyleSourceRow >[] = useMemo(
		() => [
			{
				id: 'reset',
				label: __( 'Reset selected' ),
				supportsBulk: true,
				isEligible: ( row ) => row.isChanged,
				callback( items ) {
					onReset( items );
					setSelection( [] );
				},
			},
			{
				id: 'apply-globally',
				label: __( 'Apply selected globally' ),
				isPrimary: true,
				supportsBulk: true,
				isEligible: ( row ) => row.isChanged && canApply( row ),
				callback( items ) {
					onApply( items );
					setSelection( [] );
				},
			},
		],
		[ onReset, canApply, onApply ]
	);

	const blockTitle = getBlockType( name )?.title ?? name;
	const blockSummary = variationTitle
		? sprintf(
				// translators: 1: Title of the block e.g. 'Button'. 2: Block style variation name e.g. 'Outline'.
				__( '%1$s block · %2$s style' ),
				blockTitle,
				variationTitle
			)
		: sprintf(
				// translators: %s: Title of the block e.g. 'Button'.
				__( '%s block' ),
				blockTitle
			);
	const countSummary = sprintf(
		// translators: 1: Number of styles changed on the block. 2: Number of styles.
		_n(
			'%1$d of %2$d style changed on this block',
			'%1$d of %2$d styles changed on this block',
			rows.length
		),
		changedRows.length,
		rows.length
	);

	return (
		<Modal
			title={ __( 'Where styles come from' ) }
			onRequestClose={ onRequestClose }
			size="large"
			className="editor-style-sources-modal"
		>
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				gap="md"
				className="editor-style-sources-modal__summary"
			>
				<span>{ blockSummary }</span>
				<span className="editor-style-sources-modal__muted">
					{ countSummary }
				</span>
			</Stack>
			<DataViews
				data={ sortedRows }
				fields={ FIELDS }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				selection={ currentSelection }
				onChangeSelection={ setSelection }
				getItemId={ getItemId }
				paginationInfo={ {
					totalItems: sortedRows.length,
					totalPages: 1,
				} }
				defaultLayouts={ DEFAULT_LAYOUTS }
				search={ false }
			>
				<DataViews.Layout />
				{ /* The "Apply globally" modal's footer, counting changed rows only. */ }
				<DataViewsPicker.Footer>
					<FooterSelection
						changedRows={ changedRows }
						selection={ currentSelection }
						onChangeSelection={ setSelection }
					/>
					<DataViewsPicker.Actions />
				</DataViewsPicker.Footer>
			</DataViews>
		</Modal>
	);
}
