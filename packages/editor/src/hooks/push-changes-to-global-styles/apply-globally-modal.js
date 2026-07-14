/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { DataViewsPicker } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useGlobalStyles } from '../../components/global-styles/hooks';
import { useReviewRows } from './use-review-rows';

// Only offer the table layout: a compact list with a leading selection
// checkbox.
const DEFAULT_LAYOUTS = { pickerTable: {} };

const getItemId = ( row ) => row.id;

/**
 * Modal that lets the user review the modified block-instance styles and choose
 * which ones to push to Global Styles for the block type.
 *
 * The styles are presented in a `DataViewsPicker` table with all rows selected
 * by default. The footer `Apply` action pushes only the selected subset and is
 * disabled when nothing is selected. Dismissing the modal (close button or
 * Escape) leaves the block unchanged.
 *
 * @param {Object}   props                Component props.
 * @param {string}   props.name           Block name.
 * @param {Array}    props.rows           Grouped change rows from `useChangesToPush`.
 * @param {Function} props.onApply        Called with the selected rows to push.
 * @param {Function} props.onRequestClose Called to dismiss the modal.
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
