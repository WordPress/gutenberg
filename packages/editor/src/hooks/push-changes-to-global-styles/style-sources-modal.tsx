import {
	ColorIndicator,
	Modal,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { DataViews, DataViewsPicker } from '@wordpress/dataviews';
import type { ActionButton, Field, View } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';
import { Stack, Text, Tooltip } from '@wordpress/ui';

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
	onReset: ( rows: StyleSourceRow[] ) => void;
	canApply: ( row: StyleSourceRow ) => boolean;
	onApply: ( rows: StyleSourceRow[] ) => void;
	onRequestClose: () => void;
}

// Mirrors the "Apply globally" modal: a table with a checkbox per row.
const PICKER_LAYOUTS = { pickerTable: {} };
const TABLE_LAYOUTS = { table: {} };

// Past this many characters a value truncates, with the full value in a tooltip.
const TRUNCATE_LIMIT = 48;

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
			<span className="editor-style-changes-modal__value">{ text }</span>
		</Stack>
	);
}

function Muted( { children }: { children: string } ) {
	return (
		<span className="editor-style-changes-modal__muted">{ children }</span>
	);
}

// A value with the place it is set on the line below.
function SourcedValue( {
	value,
	source,
}: {
	value: ShownValue;
	source?: string | null;
} ) {
	return (
		<Stack direction="column" className="editor-style-changes-modal__stack">
			<StyleValue { ...value } />
			{ source && <Muted>{ source }</Muted> }
		</Stack>
	);
}

function useFields( canApply: StyleSourcesModalProps[ 'canApply' ] ) {
	return useMemo(
		(): Field< StyleSourceRow >[] => [
			{
				id: 'label',
				label: __( 'Style' ),
				enableSorting: false,
				enableHiding: false,
				filterBy: false,
				getValue: ( { item } ) => item.label,
				render: ( { item } ) => item.label,
			},
			{
				id: 'this-block',
				label: __( 'This block' ),
				enableSorting: false,
				enableHiding: false,
				filterBy: false,
				getValue: ( { item } ) =>
					item.isChanged ? item.formattedValue : '',
				render: ( { item } ) => {
					if ( ! item.isChanged ) {
						return null;
					}
					return (
						<Stack
							direction="column"
							className="editor-style-changes-modal__stack"
						>
							<StyleValue { ...item } />
							{ ! canApply( item ) && (
								<Muted>{ __( 'Can’t apply globally' ) }</Muted>
							) }
						</Stack>
					);
				},
			},
			{
				id: 'global-styles',
				label: __( 'Global Styles' ),
				enableSorting: false,
				enableHiding: false,
				filterBy: false,
				getValue: ( { item } ) =>
					item.isChanged
						? ( item.replaces?.formattedValue ?? '' )
						: item.formattedValue,
				render: ( { item } ) => {
					if ( ! item.isChanged ) {
						return (
							<SourcedValue
								value={ item }
								source={ item.source }
							/>
						);
					}
					// The engine can't see block stylesheet CSS, so say only
					// what is known.
					if ( ! item.replaces ) {
						return <Muted>{ __( 'Not set' ) }</Muted>;
					}
					return (
						<SourcedValue
							value={ item.replaces }
							source={ item.replaces.source }
						/>
					);
				},
			},
		],
		[ canApply ]
	);
}

function SectionHeading( { children }: { children: string } ) {
	return (
		<Text
			variant="heading-md"
			render={ <h2 /> }
			className="editor-style-changes-modal__heading"
		>
			{ children }
		</Text>
	);
}

/**
 * The block's inherited styles: what it doesn't set itself, and where each
 * value comes from. Read only, so a plain table without checkboxes.
 *
 * @param props        Component props.
 * @param props.rows   Rows the block doesn't change.
 * @param props.fields Shared table fields.
 */
function InheritedStyles( {
	rows,
	fields,
}: {
	rows: StyleSourceRow[];
	fields: Field< StyleSourceRow >[];
} ) {
	const [ view, setView ] = useState< View >( () => ( {
		type: 'table',
		titleField: 'label',
		fields: [ 'this-block', 'global-styles' ],
		page: 1,
		perPage: 100,
		layout: { enableMoving: false },
	} ) );

	if ( ! rows.length ) {
		return null;
	}

	return (
		<section className="editor-style-changes-modal__inherited">
			<SectionHeading>
				{ sprintf(
					// translators: %d: Number of styles the block inherits.
					__( 'Inherited styles (%d)' ),
					rows.length
				) }
			</SectionHeading>
			<DataViews
				data={ rows }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				getItemId={ getItemId }
				paginationInfo={ { totalItems: rows.length, totalPages: 1 } }
				defaultLayouts={ TABLE_LAYOUTS }
				search={ false }
			>
				<DataViews.Layout />
			</DataViews>
		</section>
	);
}

/**
 * The one place to review a block's styles and act on them: the "Apply
 * globally" modal, grown to say where each value comes from and to reset.
 *
 * Changed styles come first, every one checked, with Reset and Apply globally
 * for the selection. The styles the block inherits follow, read only, each with
 * its own source.
 *
 * @param props                Component props.
 * @param props.name           Block name.
 * @param props.rows           Rows from `useStyleSources`.
 * @param props.onReset        Called with the rows to reset.
 * @param props.canApply       Whether a row can be applied globally.
 * @param props.onApply        Called with the rows to apply globally.
 * @param props.onRequestClose Called to close the modal.
 */
export default function StyleSourcesModal( {
	name,
	rows,
	onReset,
	canApply,
	onApply,
	onRequestClose,
}: StyleSourcesModalProps ) {
	const changedRows = rows.filter( ( row ) => row.isChanged );
	const inheritedRows = rows.filter( ( row ) => ! row.isChanged );
	const fields = useFields( canApply );

	const [ selection, setSelection ] = useState< string[] >( () =>
		changedRows.map( getItemId )
	);
	const [ view, setView ] = useState< View >( () => ( {
		type: 'pickerTable',
		titleField: 'label',
		fields: [ 'this-block', 'global-styles' ],
		page: 1,
		perPage: 100,
		layout: { enableMoving: false },
	} ) );
	// Drop ids whose rows a reset or apply moved out of the changed rows.
	const currentSelection = selection.filter( ( id ) =>
		changedRows.some( ( row ) => row.id === id )
	);

	// Apply skips rows Global Styles can't take, such as a shadow.
	const actions: ActionButton< StyleSourceRow >[] = useMemo(
		() => [
			{
				id: 'reset',
				label: __( 'Reset' ),
				supportsBulk: true,
				callback( items ) {
					onReset( items );
				},
			},
			{
				id: 'apply-globally',
				label: __( 'Apply globally' ),
				isPrimary: true,
				supportsBulk: true,
				isEligible: canApply,
				callback( items ) {
					onApply( items );
				},
			},
		],
		[ onReset, canApply, onApply ]
	);

	const blockTitle = getBlockType( name )?.title ?? name;

	return (
		<Modal
			title={ sprintf(
				// translators: %s: Title of the block e.g. 'Button'.
				__( '%s styles' ),
				blockTitle
			) }
			onRequestClose={ onRequestClose }
			size="large"
			className="editor-style-changes-modal"
		>
			<p>
				{ changedRows.length
					? sprintf(
							// translators: %s: Title of the block e.g. 'Button'.
							__(
								'Changes on this block override Global Styles. Apply them to all %s blocks, or reset them.'
							),
							blockTitle
						)
					: __(
							'This block doesn’t change any styles. Everything below comes from Global Styles.'
						) }
			</p>
			{ changedRows.length > 0 && (
				<DataViewsPicker
					data={ changedRows }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					actions={ actions }
					selection={ currentSelection }
					onChangeSelection={ setSelection }
					getItemId={ getItemId }
					paginationInfo={ {
						totalItems: changedRows.length,
						totalPages: 1,
					} }
					defaultLayouts={ PICKER_LAYOUTS }
					search={ false }
					itemListLabel={ __( 'Styles changed on this block' ) }
				>
					<SectionHeading>
						{ sprintf(
							// translators: %d: Number of styles changed on the block.
							__( 'Changed on this block (%d)' ),
							changedRows.length
						) }
					</SectionHeading>
					<DataViewsPicker.Layout />
					<InheritedStyles rows={ inheritedRows } fields={ fields } />
					<DataViewsPicker.Footer />
				</DataViewsPicker>
			) }
			{ ! changedRows.length && (
				<InheritedStyles rows={ inheritedRows } fields={ fields } />
			) }
		</Modal>
	);
}
