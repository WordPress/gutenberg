/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import {
	getBlockType,
	cloneBlock,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';
import { Button, MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getActiveStyle, getRenderedStyles, replaceActiveStyle } from './utils';
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
		const { getBlock, getSettings } = select( blockEditorStore );
		const block = getBlock( clientId );

		if ( ! block ) {
			return EMPTY_OBJECT;
		}
		const settings = getSettings();
		const preferredStyleVariations =
			settings.__experimentalPreferredStyleVariations;
		const blockType = getBlockType( block.name );
		const { getBlockStyles } = select( blocksStore );

		return {
			block,
			type: blockType,
			styles: getBlockStyles( block.name ),
			className: block.attributes.className || '',
			preferredStyleName: preferredStyleVariations?.value?.[ block.name ],
		};
	};

	const {
		styles,
		block,
		type,
		className,
		preferredStyleName,
	} = useSelect( selector, [ clientId ] );

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

	const containerRef = useRef();

	if ( ! styles || styles.length === 0 ) {
		return null;
	}

	const renderedStyles = getRenderedStyles( styles, preferredStyleName );
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
		<div className="block-editor-block-styles" ref={ containerRef }>
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
				<BlockStylesPreviewPanel
					activeStyle={ activeStyle }
					className={ className }
					genericPreviewBlock={ genericPreviewBlock }
					style={ hoveredStyle }
					viewportWidth={ type.example?.viewportWidth ?? 500 }
					targetRef={ containerRef }
				/>
			) }
		</div>
	);
}

export default BlockStyles;
