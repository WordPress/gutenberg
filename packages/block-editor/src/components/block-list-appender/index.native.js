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
	if ( undefined !== CustomAppender ) {
		deprecated( 'renderAppender prop of the BlockListAppender component', {
			since: '5.7',
			alternative: 'appender prop of the BlockListAppender component',
		} );
	}

	if ( isLocked || false === appender ) {
		return null;
	}

	if ( appender ) {
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
