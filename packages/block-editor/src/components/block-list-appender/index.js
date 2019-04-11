/**
 * External dependencies
 */
import { last, isFunction } from 'lodash';

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
import ButtonBlockAppender from '../button-block-appender';

function BlockListAppender( {
	blockClientIds,
	rootClientId,
	canInsertDefaultBlock,
	isLocked,
	renderAppender,
} ) {
	if ( isLocked ) {
		return null;
	}

	// If auto-insert Blocks is enabled, default to the standard behaviour
	// of auto-inserting a Block but only if no renderAppender is provided
	if ( ! renderAppender && canInsertDefaultBlock ) {
		return (
			<div className="block-list-appender">
				<IgnoreNestedEvents childHandledEvents={ [ 'onFocus', 'onClick', 'onKeyDown' ] }>
					<DefaultBlockAppender
						rootClientId={ rootClientId }
						lastBlockClientId={ last( blockClientIds ) }
					/>
				</IgnoreNestedEvents>
			</div>
		);
	}

	// Render prop - custom appender
	if ( isFunction( renderAppender ) ) {
		return (
			<div className="block-list-appender">
				{ renderAppender() }
			</div>
		);
	}

	// Fallback in the case no renderAppender has been provided
	// and we can't auto-insert the default block
	if ( ! canInsertDefaultBlock ) {
		return (
			<div className="block-list-appender">
				<ButtonBlockAppender rootClientId={ rootClientId } />
			</div>
		);
	}
}

export default withSelect( ( select, { rootClientId } ) => {
	const {
		getBlockOrder,
		canInsertBlockType,
		getTemplateLock,
	} = select( 'core/block-editor' );

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType( getDefaultBlockName(), rootClientId ),
	};
} )( BlockListAppender );
