/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const BlockInsertionPoint = ( { showInsertionPoint } ) => {
	if ( ! showInsertionPoint ) {
		return null;
	}

	return (
		<View style={ styles.containerStyleAddHere } >
			<View style={ styles.lineStyleAddHere }></View>
			<Text style={ styles.labelStyleAddHere } >{ __( 'ADD BLOCK HERE' ) }</Text>
			<View style={ styles.lineStyleAddHere }></View>
		</View>
	);
};

export default withSelect( ( select, { clientId, rootClientId } ) => {
	const {
		getBlockIndex,
		getBlockInsertionPoint,
		isBlockInsertionPointVisible,
	} = select( 'core/block-editor' );
	const blockIndex = getBlockIndex( clientId, rootClientId );
	const insertionPoint = getBlockInsertionPoint();
	const showInsertionPoint = (
		isBlockInsertionPointVisible() &&
		insertionPoint.index === blockIndex &&
		insertionPoint.rootClientId === rootClientId
	);

	return { showInsertionPoint };
} )( BlockInsertionPoint );
