/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useBlockTypesState from './hooks/use-block-types-state';

function ReusableBlocksList( { onHover, onInsert, rootClientId } ) {
	const [ items, , , onSelectItem ] = useBlockTypesState(
		rootClientId,
		onInsert
	);

	const filteredItems = useMemo( () => {
		return items.filter( ( { category } ) => category === 'reusable' );
	}, [ items ] );

	if ( filteredItems.length === 0 ) {
		return <InserterNoResults />;
	}

	return (
		<InserterPanel title={ __( 'Reusable blocks' ) }>
			<BlockTypesList
				items={ filteredItems }
				onSelect={ onSelectItem }
				onHover={ onHover }
				label={ __( 'Reusable blocks' ) }
			/>
		</InserterPanel>
	);
}

// The unwrapped component is only exported for use by unit tests.
/**
 * List of reusable blocks shown in the "Reusable" tab of the inserter.
 *
 * @param {Object}   props              Component props.
 * @param {?string}  props.rootClientId Client id of block to insert into.
 * @param {Function} props.onInsert     Callback to run when item is inserted.
 * @param {Function} props.onHover      Callback to run when item is hovered.
 *
 * @return {WPComponent} The component.
 */
export function ReusableBlocksTab( { rootClientId, onInsert, onHover } ) {
	return (
		<>
			<ReusableBlocksList
				onHover={ onHover }
				onInsert={ onInsert }
				rootClientId={ rootClientId }
			/>
			<div className="block-editor-inserter__manage-reusable-blocks-container">
				<Button
					className="block-editor-inserter__manage-reusable-blocks"
					variant="secondary"
					href={ addQueryArgs( 'edit.php', {
						post_type: 'wp_block',
					} ) }
				>
					{ __( 'Manage Reusable blocks' ) }
				</Button>
			</div>
		</>
	);
}

export default ReusableBlocksTab;
