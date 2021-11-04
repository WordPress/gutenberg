/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
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

function BlockStylesPreviewPanelFill( { children, className, style, scope } ) {
	return (
		<Fill name={ `BlockStylesPreviewPanel/${ scope }` }>
			<div className={ className } style={ style }>
				{ children }
			</div>
		</Fill>
	);
}

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
	const debouncedSetHoveredStyle = useDebounce( setHoveredStyle, 250 );
	const containerScrollTop = useMemo( () => {
		const scrollContainer = document.querySelector(
			'.interface-interface-skeleton__content'
		);
		return scrollContainer.scrollTop || 0;
	}, [ hoveredStyle ] );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const onSelectStylePreview = ( style ) => {
		onSelect( style );
		onHoverClassName( null );
		setHoveredStyle( null );
	};

	const styleItemHandler = ( item ) => {
		if ( hoveredStyle === item ) {
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
			{ hoveredStyle && (
				<BlockStylesPreviewPanelFill
					scope={ scope }
					className="block-editor-block-styles__preview-panel"
					style={ { top: 16 + containerScrollTop } }
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
