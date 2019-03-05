/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
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
	disableDefaultInserter,
} ) {
	if ( isLocked ) {
		return null;
	}

	if ( ! disableDefaultInserter && canInsertDefaultBlock ) {
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
					<Fragment>
						<Button
							className="block-list-appender__toggle"
							onClick={ onToggle }
							aria-expanded={ isOpen }
							disabled={ disabled }
						>
							<Icon icon="insert" />
							<span>{ __( 'Add a Block' ) }</span>
						</Button>

					</Fragment>
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
	} = select( 'core/block-editor' );

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType( getDefaultBlockName(), rootClientId ),
	};
} )( BlockListAppender );
