/**
 * External dependencies
 */
import { last, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getDefaultBlockName } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { Button, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import IgnoreNestedEvents from '../ignore-nested-events';
import DefaultBlockAppender from '../default-block-appender';
import Inserter from '../inserter';

function renderDefaultAppender( rootClientId, lastBlockClientId ) {
	return (
		<IgnoreNestedEvents childHandledEvents={ [ 'onFocus', 'onClick', 'onKeyDown' ] }>
			<DefaultBlockAppender
				rootClientId={ rootClientId }
				lastBlockClientId={ lastBlockClientId }
			/>
		</IgnoreNestedEvents>
	);
}

function renderBlockAppender( rootClientId ) {
	return (
		<div className="block-list-appender">
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<Button
						className="block-list-appender__toggle"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
					>
						<Icon icon="insert" />
						<span>{ __( 'Add Block' ) }</span>
					</Button>
				) }
				isAppender
			/>
		</div>
	);
}

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
	if ( ( ! renderAppender || renderAppender === 'auto-insert' ) && canInsertDefaultBlock ) {
		return renderDefaultAppender( rootClientId, last( blockClientIds ) );
	}

	// Render prop - custom appender
	if ( isFunction( renderAppender ) ) {
		return (
			<div className="block-list-appender">
				{ renderAppender() }
			</div>
		);
	}

	// If auto-insert is disabled or we have specifically
	// requested the 'block' appender
	if ( ! canInsertDefaultBlock || renderAppender === 'block' ) {
		return renderBlockAppender( rootClientId );
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
