/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getDefaultBlockName } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import DefaultBlockAppender from '../default-block-appender';
import styles from './style.scss';
import { store as blockEditorStore } from '../../store';

function BlockListAppender( {
	blockClientIds,
	rootClientId,
	canInsertDefaultBlock,
	isLocked,
	renderAppender: CustomAppender,
	appender,
	showSeparator,
} ) {
	if ( CustomAppender !== undefined ) {
		deprecated( 'renderAppender prop', {
			since: '10.9',
			alternative: 'appender prop',
		} );
	}

	if ( isLocked ) {
		return null;
	}

	if ( appender !== undefined ) {
		return appender;
	}

	if ( CustomAppender ) {
		return <CustomAppender showSeparator={ showSeparator } />;
	}

	if ( canInsertDefaultBlock ) {
		return (
			<DefaultBlockAppender
				rootClientId={ rootClientId }
				lastBlockClientId={ last( blockClientIds ) }
				containerStyle={ styles.blockListAppender }
				placeholder={ blockClientIds.length > 0 ? '' : null }
				showSeparator={ showSeparator }
			/>
		);
	}

	return null;
}

export default withSelect( ( select, { rootClientId } ) => {
	const { getBlockOrder, canInsertBlockType, getTemplateLock } = select(
		blockEditorStore
	);

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType(
			getDefaultBlockName(),
			rootClientId
		),
	};
} )( BlockListAppender );
