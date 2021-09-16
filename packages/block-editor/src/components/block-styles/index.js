/**
 * External dependencies
 */
import { find, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { _x } from '@wordpress/i18n';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';
import { Button, MenuItem, Popover } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getActiveStyle, replaceActiveStyle } from './utils';
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
			if ( hoveredStyle === item ) {
				return;
			}
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
	const activeStyle = getActiveStyle( renderedStyles, className );

	const onSelectStyle = ( style ) => {
		const styleClassName = replaceActiveStyle(
			className,
			activeStyle,
			style
		);
		updateBlockAttributes( clientId, {
			className: styleClassName,
		} );
		onHoverClassName( null );
		setHoveredStyle( null );
		onSwitch();
	};

	if ( itemRole === 'menuitem' ) {
		return (
			<div className="block-editor-block-styles__menu">
				{ renderedStyles.map( ( style ) => {
					const menuItemText = style.label || style.name;
					return (
						<MenuItem
							key={ style.name }
							icon={
								activeStyle.name === style.name ? check : null
							}
							onClick={ () => onSelectStyle( style ) }
						>
							{ menuItemText }
						</MenuItem>
					);
				} ) }
			</div>
		);
	}

	return (
		<div className="block-editor-block-styles">
			<div className="block-editor-block-styles__variants">
				{ renderedStyles.map( ( style ) => {
					const buttonText = style.label || style.name;

					return (
						<Button
							className={ classnames(
								'block-editor-block-styles__button',
								{
									'is-active':
										activeStyle.name === style.name,
								}
							) }
							key={ style.name }
							variant="secondary"
							label={ buttonText }
							onMouseEnter={ () => onStyleHover( style ) }
							onFocus={ () => onStyleHover( style ) }
							onMouseLeave={ () => setHoveredStyle( null ) }
							onBlur={ () => setHoveredStyle( null ) }
							onKeyDown={ ( event ) => {
								if (
									ENTER === event.keyCode ||
									SPACE === event.keyCode
								) {
									event.preventDefault();
									onSelectStyle( style );
								}
							} }
							onClick={ () => onSelectStyle( style ) }
							role="button"
							tabIndex="0"
						>
							{ buttonText }
						</Button>
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

export default BlockStyles;
