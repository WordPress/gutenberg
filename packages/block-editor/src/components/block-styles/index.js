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
import TokenList from '@wordpress/token-list';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { _x } from '@wordpress/i18n';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

/**
 * Returns the active style from the given className.
 *
 * @param {Array} styles Block style variations.
 * @param {string} className  Class name
 *
 * @return {Object?} The active style.
 */
export function getActiveStyle( styles, className ) {
	for ( const style of new TokenList( className ).values() ) {
		if ( style.indexOf( 'is-style-' ) === -1 ) {
			continue;
		}

		const potentialStyleName = style.substring( 9 );
		const activeStyle = find( styles, { name: potentialStyleName } );
		if ( activeStyle ) {
			return activeStyle;
		}
	}

	return find( styles, 'isDefault' );
}

/**
 * Replaces the active style in the block's className.
 *
 * @param {string}  className   Class name.
 * @param {Object?} activeStyle The replaced style.
 * @param {Object}  newStyle    The replacing style.
 *
 * @return {string} The updated className.
 */
export function replaceActiveStyle( className, activeStyle, newStyle ) {
	const list = new TokenList( className );

	if ( activeStyle ) {
		list.remove( 'is-style-' + activeStyle.name );
	}

	if ( ! newStyle.isDefault ) {
		list.add( 'is-style-' + newStyle.name );
	}

	return list.value;
}

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
		const { getBlockStyles } = select( 'core/blocks' );
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

	if ( ! type.styles && ! find( styles, 'isDefault' ) ) {
		styles.unshift( {
			name: 'default',
			label: _x( 'Default', 'block style' ),
			isDefault: true,
		} );
	}

	const activeStyle = getActiveStyle( styles, className );
	return (
		<div className="block-editor-block-styles">
			{ styles.map( ( style ) => {
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
