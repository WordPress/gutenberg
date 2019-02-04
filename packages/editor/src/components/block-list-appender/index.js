/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getDefaultBlockName } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

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
} ) {
	if ( isLocked ) {
		return null;
	}

	if ( canInsertDefaultBlock ) {
		return (
			<IgnoreNestedEvents childHandledEvents={ [ 'onFocus', 'onClick', 'onKeyDown' ] }>
				<DefaultBlockAppender
					rootClientId={ rootClientId }
					lastBlockClientId={ last( blockClientIds ) }
				/>
			</IgnoreNestedEvents>
		);
	}

	return (
		<div className="block-list-appender">
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<IconButton
						label={ __( 'Add block' ) }
						icon="insert"
						onClick={ onToggle }
						className="block-list-appender__toggle"
						aria-haspopup="true"
						aria-expanded={ isOpen }
						disabled={ disabled }
					/>
				) }
				isAppender
			/>
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
