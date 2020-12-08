/**
 * External dependencies
 */
import { find, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { _x } from '@wordpress/i18n';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getActiveStyle, replaceActiveStyle } from './utils';
import BlockPreview from '../block-preview';

const useGenericPreviewBlock = ( block, type ) =>
	useMemo(
		() =>
			type.example
				? getBlockFromExample( block.name, {
						attributes: type.example.attributes,
						innerBlocks: type.example.innerBlocks,
				  } )
				: cloneBlock( block ),
		[ type.example ? block.name : block, type ]
	);

function BlockStyles( {
	clientId,
	onSwitch = noop,
	onHoverClassName = noop,
	itemRole,
} ) {
	const selector = ( select ) => {
		const { getBlock } = select( 'core/block-editor' );
		const { getBlockStyles } = select( blocksStore );
		const block = getBlock( clientId );
		const blockType = getBlockType( block.name );
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

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const genericPreviewBlock = useGenericPreviewBlock( block, type );

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

	const activeStyle = getActiveStyle( renderedStyles, className );
	return (
		<div className="block-editor-block-styles">
			{ renderedStyles.map( ( style ) => {
				const styleClassName = replaceActiveStyle(
					className,
					activeStyle,
					style
				);
				return (
					<BlockStyleItem
						genericPreviewBlock={ genericPreviewBlock }
						className={ className }
						isActive={ activeStyle === style }
						key={ style.name }
						onSelect={ () => {
							updateBlockAttributes( clientId, {
								className: styleClassName,
							} );
							onHoverClassName( null );
							onSwitch();
						} }
						onBlur={ () => onHoverClassName( null ) }
						onHover={ () => onHoverClassName( styleClassName ) }
						style={ style }
						styleClassName={ styleClassName }
						itemRole={ itemRole }
					/>
				);
			} ) }
		</div>
	);
}

function BlockStyleItem( {
	genericPreviewBlock,
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
				<BlockPreview viewportWidth={ 500 } blocks={ previewBlocks } />
			</div>
			<div className="block-editor-block-styles__item-label">
				{ style.label || style.name }
			</div>
		</div>
	);
}

export default BlockStyles;
