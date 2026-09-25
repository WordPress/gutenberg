import { Modal } from '@wordpress/components';
import { DataViewsPicker } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import { useReviewRows } from './use-review-rows';

// Show a simple table with a checkbox at the start of each row.
const DEFAULT_LAYOUTS = { pickerTable: {} };

const getItemId = ( row ) => row.id;

/**
 * Modal for reviewing a block's changed styles and choosing which ones to apply
 * to every block of the same type.
 *
 * Each style is a row in the table and starts out selected. Apply pushes only
 * the rows that are still selected, and is turned off when none are. Closing
 * the modal or pressing Escape leaves the block untouched.
 *
 * @param {Object}   props                Component props.
 * @param {string}   props.name           Block name.
 * @param {Array}    props.rows           The block's changed styles, grouped into rows.
 * @param {Function} props.onApply        Called with the selected rows to apply.
 * @param {Function} props.onRequestClose Called to close the modal.
 */
export default function ApplyGloballyModal( {
	name,
	rows,
	onApply,
	onRequestClose,
} ) {
	const { merged } = useGlobalStyles();
	const reviewRows = useReviewRows( rows, merged, name );

	const [ selection, setSelection ] = useState( () =>
		reviewRows.map( ( row ) => row.id )
	);
	const [ view, setView ] = useState( () => ( {
		type: 'pickerTable',
		titleField: 'label',
		fields: [ 'current', 'new' ],
		page: 1,
		perPage: reviewRows.length,
		layout: { enableMoving: false },
	} ) );

	const fields = useMemo(
		() => [
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
				id: 'current',
				label: __( 'Current' ),
				enableSorting: false,
				enableHiding: false,
				filterBy: false,
				getValue: ( { item } ) => item.formattedCurrentValue,
				render: ( { item } ) => (
					<span className="editor-push-changes-to-global-styles-modal__value">
						{ item.formattedCurrentValue }
					</span>
				),
			},
			{
				id: 'new',
				label: __( 'New' ),
				enableSorting: false,
				enableHiding: false,
				filterBy: false,
				getValue: ( { item } ) => item.formattedNewValue,
				render: ( { item } ) => (
					<span className="editor-push-changes-to-global-styles-modal__value">
						{ item.formattedNewValue }
					</span>
				),
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'apply',
				label: __( 'Apply' ),
				isPrimary: true,
				supportsBulk: true,
				callback( items ) {
					onApply( items );
					onRequestClose();
				},
			},
		],
		[ onApply, onRequestClose ]
	);

	const blockTitle = getBlockType( name )?.title;

	return (
		<Modal
			title={ sprintf(
				// translators: %s: Title of the block e.g. 'Heading'.
				__( 'Apply %s styles globally' ),
				blockTitle
			) }
			onRequestClose={ onRequestClose }
			size="large"
			className="editor-push-changes-to-global-styles-modal"
		>
			<p>
				{ sprintf(
					// translators: %s: Title of the block e.g. 'Heading'.
					__(
						'Choose which styles to make default for all %s blocks.'
					),
					blockTitle
				) }
			</p>
			<DataViewsPicker
				data={ reviewRows }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ setSelection }
				getItemId={ getItemId }
				paginationInfo={ {
					totalItems: reviewRows.length,
					totalPages: 1,
				} }
				defaultLayouts={ DEFAULT_LAYOUTS }
				search={ false }
				itemListLabel={ __( 'Styles to apply' ) }
			>
				<DataViewsPicker.Layout />
				<DataViewsPicker.Footer />
			</DataViewsPicker>
		</Modal>
	);
}
