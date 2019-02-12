/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, Slot } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';

const InserterInlineElements = ( {
	filterValue,
	onPanelToggle,
	panelOpened,
	panelRef,
	whenEmpty,
} ) => {
	return (
		<Slot name="Inserter.InlineElements" fillProps={ { filterValue } }>
			{ ( fills ) => {
				if ( isEmpty( fills ) ) {
					return whenEmpty;
				}
				return (
					<PanelBody
						title={ __( 'Inline Elements' ) }
						opened={ panelOpened }
						onToggle={ onPanelToggle }
						ref={ panelRef }
						className="editor-inserter__inline-elements"
					>
						<BlockTypesList>
							{ fills }
						</BlockTypesList>
					</PanelBody>
				);
			} }
		</Slot>
	);
};

export default InserterInlineElements;
