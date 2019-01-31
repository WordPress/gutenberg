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

const InserterInlineElements = ( { filterValue } ) => {
	return (
		<Slot name="Inserter.InlineElements" fillProps={ { filterValue } }>
			{ ( fills ) => ! isEmpty( fills ) && (
				<PanelBody
					title={ __( 'Inline Elements' ) }
					initialOpen={ false }
					className="editor-inserter__inline-elements"
				>
					<BlockTypesList>
						{ fills }
					</BlockTypesList>
				</PanelBody>
			) }
		</Slot>
	);
};

export default InserterInlineElements;
