/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';

/**
 * NOTE: This component is only used by the List (V2) and Group blocks. It only
 * passes the props required for these blocks. To use it with other blocks,
 * update this component to support any additional props required by the new
 * block: components/inner-blocks/index.native.js
 */

function BlockListCompact( props ) {
	const {
		blockWidth,
		marginHorizontal = styles.defaultBlock.marginLeft,
		marginVertical = styles.defaultBlock.marginTop,
		parentWidth,
		renderAppender,
		rootClientId,
	} = props;
	const { blockClientIds, isParentSelected } = useSelect(
		( select ) => {
			const { getBlockOrder, getSelectedBlockClientId } =
				select( blockEditorStore );
			const blockOrder = getBlockOrder( rootClientId );

			const selectedBlockClientId = getSelectedBlockClientId();

			return {
				blockClientIds: blockOrder,
				isParentSelected:
					rootClientId === selectedBlockClientId ||
					( ! rootClientId && ! selectedBlockClientId ),
			};
		},
		[ rootClientId ]
	);

	const containerStyle = {
		marginVertical: -marginVertical,
		marginHorizontal: -marginHorizontal,
	};

	const isEmptylist = blockClientIds.length === 0;

	return (
		<View style={ containerStyle } testID="block-list-wrapper">
			{ blockClientIds.map( ( currentClientId ) => (
				<BlockListBlock
					blockWidth={ blockWidth }
					parentWidth={ parentWidth }
					clientId={ currentClientId }
					rootClientId={ rootClientId }
					key={ currentClientId }
					marginHorizontal={ marginHorizontal }
					marginVertical={ marginVertical }
				/>
			) ) }
			{ renderAppender && isParentSelected && (
				<View
					style={ {
						marginVertical:
							isEmptylist && styles.defaultAppender.marginTop,
						marginHorizontal:
							! isEmptylist &&
							marginHorizontal - styles.innerAppender.marginLeft,
					} }
				>
					<BlockListAppender
						rootClientId={ rootClientId }
						renderAppender={ renderAppender }
						showSeparator
					/>
				</View>
			) }
		</View>
	);
}

export default BlockListCompact;
