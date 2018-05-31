/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ItemList from './item-list';
import { searchItems } from './menu';

const { Fill, Slot } = createSlotFill( 'InserterResultsPortal' );

const InserterResultsPortal = ( { items, title, onSelect, onHover } ) => {
	return (
		<Fill>
			{ ( { filterValue } ) => {
				const filteredItems = searchItems( items, filterValue );

				if ( ! filteredItems.length ) {
					return null;
				}

				return (
					<PanelBody
						title={ title }
					>
						<ItemList items={ filteredItems } onSelect={ onSelect } onHover={ onHover } />
					</PanelBody>
				);
			} }
		</Fill>
	);
};

InserterResultsPortal.Slot = Slot;

export default InserterResultsPortal;
