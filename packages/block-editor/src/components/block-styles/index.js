/**
 * External dependencies
 */
import { noop, debounce } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { ENTER, SPACE } from '@wordpress/keycodes';
import {
	Button,
	__experimentalText as Text,
	Slot,
	Fill,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockStylesPreviewPanel from './preview-panel';
import useStylesForBlocks from './use-styles-for-block';

function BlockStylesPreviewPanelSlot( { scope } ) {
	return <Slot name={ `BlockStylesPreviewPanel/${ scope }` } />;
}

function BlockStylesPreviewPanelFill( { children, scope, ...props } ) {
	return (
		<Fill name={ `BlockStylesPreviewPanel/${ scope }` }>
			<div { ...props }>{ children }</div>
		</Fill>
	);
}

// Top position (in px) of the Block Styles container
// relative to the editor pane.
// The value is the equivalent of the container's right position.
const DEFAULT_POSITION_TOP = 16;

// Block Styles component for the Settings Sidebar.
function BlockStyles( {
	clientId,
	onSwitch = noop,
	onHoverClassName = noop,
	scope,
} ) {
	const {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className: previewClassName,
	} = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const [ containerScrollTop, setContainerScrollTop ] = useState( 0 );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	useLayoutEffect( () => {
		const scrollContainer = document.querySelector(
			'.interface-interface-skeleton__content'
		);
		const scrollTop = scrollContainer?.scrollTop || 0;
		setContainerScrollTop( scrollTop + DEFAULT_POSITION_TOP );
	}, [ hoveredStyle ] );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const debouncedSetHoveredStyle = debounce( setHoveredStyle, 250 );

	const onSelectStylePreview = ( style ) => {
		onSelect( style );
		onHoverClassName( null );
		setHoveredStyle( null );
		debouncedSetHoveredStyle.cancel();
	};

	const styleItemHandler = ( item ) => {
		if ( hoveredStyle === item ) {
			debouncedSetHoveredStyle.cancel();
			return;
		}
		debouncedSetHoveredStyle( item );
		onHoverClassName( item?.name ?? null );
	};

	return (
		<div className="block-editor-block-styles">
			<div className="block-editor-block-styles__variants">
				{ stylesToRender.map( ( style ) => {
					const buttonText = style.label || style.name;

					return (
						<Button
							className={ classnames(
								'block-editor-block-styles__item',
								{
									'is-active':
										activeStyle.name === style.name,
								}
							) }
							key={ style.name }
							variant="secondary"
							label={ buttonText }
							onMouseEnter={ () => styleItemHandler( style ) }
							onFocus={ () => styleItemHandler( style ) }
							onMouseLeave={ () => styleItemHandler( null ) }
							onBlur={ () => styleItemHandler( null ) }
							onKeyDown={ ( event ) => {
								if (
									ENTER === event.keyCode ||
									SPACE === event.keyCode
								) {
									event.preventDefault();
									onSelectStylePreview( style );
								}
							} }
							onClick={ () => onSelectStylePreview( style ) }
							role="button"
							tabIndex="0"
						>
							<Text
								as="span"
								limit={ 12 }
								ellipsizeMode="tail"
								className="block-editor-block-styles__item-text"
								truncate
							>
								{ buttonText }
							</Text>
						</Button>
					);
				} ) }
			</div>
			{ hoveredStyle && ! isMobileViewport && (
				<BlockStylesPreviewPanelFill
					scope={ scope }
					className="block-editor-block-styles__preview-panel"
					style={ { top: containerScrollTop } }
					onMouseLeave={ () => styleItemHandler( null ) }
				>
					<BlockStylesPreviewPanel
						activeStyle={ activeStyle }
						className={ previewClassName }
						genericPreviewBlock={ genericPreviewBlock }
						style={ hoveredStyle }
					/>
				</BlockStylesPreviewPanelFill>
			) }
		</div>
	);
}

BlockStyles.Slot = BlockStylesPreviewPanelSlot;
export default BlockStyles;
