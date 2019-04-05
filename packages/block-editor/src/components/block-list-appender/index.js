/**
 * External dependencies
 */
import { last, isFunction, isString } from 'lodash';

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

	if ( ( ! renderAppender || renderAppender === 'auto-insert' ) && canInsertDefaultBlock ) {
		return (
			<IgnoreNestedEvents childHandledEvents={ [ 'onFocus', 'onClick', 'onKeyDown' ] }>
				<DefaultBlockAppender
					rootClientId={ rootClientId }
					lastBlockClientId={ last( blockClientIds ) }
				/>
			</IgnoreNestedEvents>
		);
	}

	if ( isString( renderAppender ) && renderAppender === 'block' ) {
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

	// Render prop - custom appender
	if ( isFunction( renderAppender ) ) {
		return (
			<div className="block-list-appender">
				{ renderAppender() }
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
