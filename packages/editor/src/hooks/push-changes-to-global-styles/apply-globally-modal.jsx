import { Modal } from '@wordpress/components';
import { DataViewsPicker } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import { useReviewRows, useSiblingReviewRows } from './use-review-rows';
import { SCOPE_SIBLINGS } from './sibling-styles';

// Show a simple table with a checkbox at the start of each row.
const DEFAULT_LAYOUTS = { pickerTable: {} };

const getItemId = ( row ) => row.id;

/**
 * Modal for reviewing a block's changed styles and choosing which ones to apply
 * to every block of the same type, either across the site or within the parent
 * block the siblings share.
 *
 * Each style is a row in the table and starts out selected. Apply pushes only
 * the rows that are still selected, and is turned off when none are. Closing
 * the modal or pressing Escape leaves the block untouched.
 *
 * @param {Object}   props                  Component props.
 * @param {string}   props.name             Block name.
 * @param {Array}    props.rows             The block's changed styles, grouped into rows.
 * @param {string}   props.scope            Which scope to apply to, `global` or `siblings`.
 * @param {?string}  props.scopeBlockTitle  Title of the block the siblings share, for the sibling scope.
 * @param {string[]} props.siblingClientIds The siblings to apply to, for the sibling scope.
 * @param {Function} props.onApply          Called with the selected rows to apply.
 * @param {Function} props.onRequestClose   Called to close the modal.
 */
export default function ApplyGloballyModal( {
	name,
	rows,
	scope,
	scopeBlockTitle,
	siblingClientIds = [],
	onApply,
	onRequestClose,
} ) {
	const { merged } = useGlobalStyles();
	const isSiblingScope = scope === SCOPE_SIBLINGS;

	// Only read while the modal is open, which is the only time the sibling
	// values are shown.
	const siblings = useSelect(
		( select ) => {
			if ( ! isSiblingScope ) {
				return [];
			}
			const { getBlockAttributes } = select( blockEditorStore );
			return siblingClientIds.map( ( clientId ) => ( {
				clientId,
				attributes: getBlockAttributes( clientId ),
			} ) );
		},
		[ isSiblingScope, siblingClientIds ]
	);

	// Both run so the hook order stays the same whichever scope is active.
	const globalReviewRows = useReviewRows( rows, merged, name );
	const siblingReviewRows = useSiblingReviewRows(
		rows,
		siblings,
		merged,
		name
	);
	const reviewRows = isSiblingScope ? siblingReviewRows : globalReviewRows;

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
			title={
				isSiblingScope
					? sprintf(
							// translators: 1: Title of the block e.g. 'Button'. 2: Title of the parent block e.g. 'Buttons'.
							__( 'Apply %1$s styles in this %2$s' ),
							blockTitle,
							scopeBlockTitle
						)
					: sprintf(
							// translators: %s: Title of the block e.g. 'Heading'.
							__( 'Apply %s styles globally' ),
							blockTitle
						)
			}
			onRequestClose={ onRequestClose }
			size="large"
			className="editor-push-changes-to-global-styles-modal"
		>
			<p>
				{ isSiblingScope
					? sprintf(
							// translators: 1: Title of the block e.g. 'Button'. 2: Title of the parent block e.g. 'Buttons'.
							__(
								'Choose which styles to copy to every other %1$s block in this %2$s.'
							),
							blockTitle,
							scopeBlockTitle
						)
					: sprintf(
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
