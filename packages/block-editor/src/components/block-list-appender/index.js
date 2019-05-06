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
import ButtonBlockAppender from '../button-block-appender';

function BlockListAppender( {
	blockClientIds,
	rootClientId,
	canInsertDefaultBlock,
	isLocked,
	renderAppender: CustomAppender,
} ) {
	if ( isLocked ) {
		return null;
	}

	// A render prop has been provided, use it to render the appender.
	if ( CustomAppender ) {
		return (
			<div className="block-list-appender">
				<CustomAppender />
			</div>
		);
	}

	// Render the default block appender when renderAppender has not been
	// provided and the context supports use of the default appender.
	if ( canInsertDefaultBlock ) {
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

	// Fallback in the case no renderAppender has been provided and the
	// default block can't be inserted.
	return (
		<div className="block-list-appender">
			<ButtonBlockAppender
				rootClientId={ rootClientId }
				className="block-list-appender__toggle"
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
