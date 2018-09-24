/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import IgnoreNestedEvents from '../ignore-nested-events';
import DefaultBlockAppender from '../default-block-appender';
import Inserter from '../inserter';

function BlockListAppender( {
	blockClientIds,
	layout,
	isGroupedByLayout,
	rootClientId,
	canInsertDefaultBlock,
	isLocked,
} ) {
	if ( isLocked ) {
		return null;
	}

	let defaultLayout;
	if ( isGroupedByLayout ) {
		defaultLayout = layout;
	}

	if ( canInsertDefaultBlock ) {
		return (
			<IgnoreNestedEvents childHandledEvents={ [ 'onFocus', 'onClick', 'onKeyDown' ] }>
				<DefaultBlockAppender
					rootClientId={ rootClientId }
					lastBlockClientId={ last( blockClientIds ) }
					layout={ defaultLayout }
				/>
			</IgnoreNestedEvents>
		);
	}

	return (
		<div className="block-list-appender">
			<Inserter rootClientId={ rootClientId } layout={ defaultLayout } />
		</div>
	);
}

export default withSelect( ( select, { rootClientId } ) => {
	const {
		getBlockOrder,
		canInsertBlockType,
		getTemplateLock,
	} = select( 'core/editor' );

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType( getDefaultBlockName(), rootClientId ),
	};
} )( BlockListAppender );
