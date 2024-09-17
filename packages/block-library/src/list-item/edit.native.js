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
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useState, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMerge, useEnter } from './hooks';
import { IndentUI } from './edit.js';
import styles from './style.scss';
import ListStyleType from './list-style-type';

const OPACITY = '9e';

export default function ListItemEdit( {
	attributes,
	setAttributes,
	clientId,
	style,
	mergeBlocks,
} ) {
	const [ contentWidth, setContentWidth ] = useState();
	const { placeholder, content } = attributes;
	const {
		blockIndex,
		hasInnerBlocks,
		indentationLevel,
		numberOfListItems,
		ordered,
		reversed,
		start,
	} = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockCount,
				getBlockIndex,
				getBlockParentsByBlockName,
				getBlockRootClientId,
			} = select( blockEditorStore );
			const currentIdentationLevel = getBlockParentsByBlockName(
				clientId,
				'core/list-item',
				true
			).length;
			const currentBlockIndex = getBlockIndex( clientId );
			const blockWithInnerBlocks = getBlockCount( clientId ) > 0;
			const rootClientId = getBlockRootClientId( clientId );
			const blockAttributes = getBlockAttributes( rootClientId );
			const totalListItems = getBlockCount( rootClientId );
			const {
				ordered: isOrdered,
				reversed: isReversed,
				start: startValue,
			} = blockAttributes || {};

			return {
				blockIndex: currentBlockIndex,
				hasInnerBlocks: blockWithInnerBlocks,
				indentationLevel: currentIdentationLevel,
				numberOfListItems: totalListItems,
				ordered: isOrdered,
				reversed: isReversed,
				start: startValue,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		...( hasInnerBlocks && styles[ 'wp-block-list-item__nested-blocks' ] ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
	} );

	// Set default placeholder text color from light/dark scheme or base colors
	const defaultPlaceholderFromScheme = usePreferredColorSchemeStyle(
		styles[ 'wp-block-list-item__list-item-placeholder' ],
		styles[ 'wp-block-list-item__list-item-placeholder--dark' ]
	);

	const currentTextColor = style?.color || style?.baseColors?.color?.text;

	const defaultPlaceholderTextColor = currentTextColor
		? currentTextColor
		: defaultPlaceholderFromScheme?.color;

	// Add hex opacity to default placeholder text color and style object
	const defaultPlaceholderTextColorWithOpacity =
		defaultPlaceholderTextColor + OPACITY;

	const styleWithPlaceholderOpacity = {
		...style,
		...( style?.color && {
			placeholderColor: style.color + OPACITY,
		} ),
	};

	const preventDefault = useRef( false );
	const { onEnter } = useEnter( { content, clientId }, preventDefault );
	const onMerge = useMerge( clientId, mergeBlocks );
	const onLayout = useCallback( ( { nativeEvent } ) => {
		setContentWidth( ( prevState ) => {
			const { width } = nativeEvent.layout;

			if ( ! prevState || prevState.width !== width ) {
				return Math.floor( width );
			}
			return prevState;
		} );
	}, [] );

	return (
		<View style={ styles[ 'wp-block-list-item__list-item-parent' ] }>
			<View style={ styles[ 'wp-block-list-item__list-item' ] }>
				<View style={ styles[ 'wp-block-list-item__list-item-icon' ] }>
					<ListStyleType
						blockIndex={ blockIndex }
						indentationLevel={ indentationLevel }
						numberOfListItems={ numberOfListItems }
						ordered={ ordered }
						reversed={ reversed }
						start={ start }
						style={ style }
					/>
				</View>
				<View
					style={ styles[ 'wp-block-list-item__list-item-content' ] }
					onLayout={ onLayout }
				>
					<RichText
						__unstableUseSplitSelection
						identifier="content"
						tagName="p"
						onChange={ ( nextContent ) =>
							setAttributes( { content: nextContent } )
						}
						value={ content }
						placeholder={ placeholder || __( 'List' ) }
						placeholderTextColor={
							defaultPlaceholderTextColorWithOpacity
						}
						onMerge={ onMerge }
						onEnter={ onEnter }
						style={ styleWithPlaceholderOpacity }
						deleteEnter
						containerWidth={ contentWidth }
					/>
				</View>
			</View>
			<View { ...innerBlocksProps }></View>
			<BlockControls group="block">
				<IndentUI clientId={ clientId } />
			</BlockControls>
		</View>
	);
}
