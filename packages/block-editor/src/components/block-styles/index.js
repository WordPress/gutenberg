/**
 * External dependencies
 */
import { find, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {useCallback, useMemo, useState} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { _x } from '@wordpress/i18n';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';
import { Button, Popover} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { getActiveStyle, replaceActiveStyle } from './utils';
import BlockPreview from '../block-preview';
import BlockStylesPreviewPanel from './block-styles-preview-panel';
import { store as blockEditorStore } from '../../store';

const EMPTY_OBJECT = {};

function useGenericPreviewBlock( block, type ) {
	return useMemo( () => {
		const example = type?.example;
		const blockName = type?.name;

		if ( example && blockName ) {
			return getBlockFromExample( blockName, {
				attributes: example.attributes,
				innerBlocks: example.innerBlocks,
			} );
		}

		if ( block ) {
			return cloneBlock( block );
		}
	}, [ type?.example ? block?.name : block, type ] );
}

function BlockStyles( {
	clientId,
	onSwitch = noop,
	onHoverClassName = noop,
	itemRole,
} ) {
	const selector = ( select ) => {
		const { getBlock } = select( blockEditorStore );
		const block = getBlock( clientId );

		if ( ! block ) {
			return EMPTY_OBJECT;
		}

		const blockType = getBlockType( block.name );
		const { getBlockStyles } = select( blocksStore );
		return {
			block,
			type: blockType,
			styles: getBlockStyles( block.name ),
			className: block.attributes.className || '',
		};
	};

	const { styles, block, type, className } = useSelect( selector, [
		clientId,
	] );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const genericPreviewBlock = useGenericPreviewBlock( block, type );
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const onStyleHover = useCallback(
		( item ) => {
			setHoveredStyle( item );
		},
		[ setHoveredStyle ]
	);

	if ( ! styles || styles.length === 0 ) {
		return null;
	}

	const renderedStyles = find( styles, 'isDefault' )
		? styles
		: [
				{
					name: 'default',
					label: _x( 'Default', 'block style' ),
					isDefault: true,
				},
				...styles,
		  ];

	/* TODO
		- get top offset of styles panel
		- create a portal into the Editor content container `interface-interface-skeleton__content` or the block-editor__container
		- inject the preview and assign right:0

	 */
	const activeStyle = getActiveStyle( renderedStyles, className );
	return (
		<div className="block-editor-block-styles">
			<div className="block-editor-block-styles__variants">
				{ renderedStyles.map( ( style ) => {
					const styleClassName = replaceActiveStyle(
						className,
						activeStyle,
						style
					);
					const buttonText = style.label || style.name;

					return (
						<Button
							className={ classnames( 'block-editor-block-styles__button', {
								'is-active': activeStyle === style,
							} ) }
							key={ style.name }
							variant="secondary"
							label={ buttonText }
							onMouseEnter={ () => onStyleHover( style ) }
							onMouseLeave={ () => setHoveredStyle( null ) }
							onClick={ () => {
								updateBlockAttributes( clientId, {
									className: styleClassName,
								} );
								onHoverClassName( null );
								setHoveredStyle( null );
								onSwitch();
							} }
						> { buttonText } </Button>
						// <BlockStyleItem
						// 	genericPreviewBlock={ genericPreviewBlock }
						// 	viewportWidth={ type.example?.viewportWidth ?? 500 }
						// 	className={ className }
						// 	isActive={ activeStyle === style }
						// 	key={ style.name }
						// 	onSelect={ () => {
						// 		updateBlockAttributes( clientId, {
						// 			className: styleClassName,
						// 		} );
						// 		onHoverClassName( null );
						// 		onSwitch();
						// 	} }
						// 	onBlur={ () => onHoverClassName( null ) }
						// 	onHover={ () => {
						// 		onHoverClassName( styleClassName );
						// 	} }
						// 	style={ style }
						// 	styleClassName={ styleClassName }
						// 	itemRole={ itemRole }
						// />
					);
				} ) }
			</div>
			{ hoveredStyle && (
				<Popover
					className="block-editor-block-styles__popover"
					position="middle left"
					focusOnMount={ false }
				>
					<BlockStylesPreviewPanel
						activeStyle={ activeStyle }
						className={ className }
						genericPreviewBlock={ genericPreviewBlock }
						style={ hoveredStyle }
						viewportWidth={ type.example?.viewportWidth ?? 500 }
					/>
				</Popover>
			) }
		</div>
	);
}

function BlockStyleItem( {
	genericPreviewBlock,
	viewportWidth,
	style,
	isActive,
	onBlur,
	onHover,
	onSelect,
	styleClassName,
	itemRole,
} ) {
	const previewBlocks = useMemo( () => {
		return {
			...genericPreviewBlock,
			attributes: {
				...genericPreviewBlock.attributes,
				className: styleClassName,
			},
		};
	}, [ genericPreviewBlock, styleClassName ] );

	return (
		<div
			key={ style.name }
			className={ classnames( 'block-editor-block-styles__item', {
				'is-active': isActive,
			} ) }
			onClick={ () => onSelect() }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					event.preventDefault();
					onSelect();
				}
			} }
			onMouseEnter={ onHover }
			onMouseLeave={ onBlur }
			role={ itemRole || 'button' }
			tabIndex="0"
			aria-label={ style.label || style.name }
		>
			<div className="block-editor-block-styles__item-preview">
				<BlockPreview
					viewportWidth={ viewportWidth }
					blocks={ previewBlocks }
				/>
			</div>
			<div className="block-editor-block-styles__item-label">
				{ style.label || style.name }
			</div>
		</div>
	);
}

export default BlockStyles;
