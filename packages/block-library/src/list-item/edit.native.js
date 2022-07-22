/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useSplit, useMerge } from './hooks';
import { convertToListItems } from './utils';
import { IndentUI } from './edit.js';
import styles from './style.scss';

export default function ListItemEdit( {
	attributes,
	setAttributes,
	onReplace,
	clientId,
} ) {
	const { placeholder, content } = attributes;
	const { hasInnerBlocks } = useSelect(
		( select ) => {
			const { getBlockCount } = select( blockEditorStore );
			return {
				hasInnerBlocks: getBlockCount( clientId ) > 0,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		...( hasInnerBlocks && styles[ 'wp-block-list-item__nested-blocks' ] ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/list' ],
	} );

	const onSplit = useSplit( clientId );
	const onMerge = useMerge( clientId );

	return (
		<>
			<RichText
				identifier="content"
				tagName="div"
				onChange={ ( nextContent ) =>
					setAttributes( { content: nextContent } )
				}
				value={ content }
				placeholder={ placeholder || __( 'List' ) }
				onSplit={ onSplit }
				onMerge={ onMerge }
				onReplace={ ( blocks, ...args ) => {
					onReplace( convertToListItems( blocks ), ...args );
				} }
			/>
			<View { ...innerBlocksProps }>{ innerBlocksProps.children }</View>
			<BlockControls group="block">
				<IndentUI clientId={ clientId } />
			</BlockControls>
		</>
	);
}
