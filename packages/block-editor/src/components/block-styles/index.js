/**
 * WordPress dependencies
 */
import {
	ColorIndicator,
	Flex,
	FlexItem,
	Popover,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
} from '@wordpress/components';
import { debounce, useViewportMatch } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import BlockStylesPreviewPanel from './preview-panel';
import useStylesForBlocks from './use-styles-for-block';
import { getDefaultStyle } from './utils';

const noop = () => {};
const { CustomSelect, CustomSelectItem } = unlock( componentsPrivateApis );

const BlockStyleItem = ( { blockStyle } ) => {
	const indicators = [
		blockStyle.styles?.color?.background,
		blockStyle.styles?.color?.text,
	];

	return (
		<HStack justify="flex-start">
			<ZStack isLayered={ false } offset={ -8 }>
				{ indicators.map( ( indicator, index ) => (
					<Flex key={ index } expanded={ false }>
						<ColorIndicator colorValue={ indicator } />
					</Flex>
				) ) }
			</ZStack>
			<FlexItem title={ blockStyle.label }>{ blockStyle.label }</FlexItem>
		</HStack>
	);
};

function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
	const {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className: previewClassName,
	} = useStylesForBlocks( { clientId, onSwitch } );

	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const debouncedSetHoveredStyle = debounce( setHoveredStyle, 250 );

	const handleOnChange = ( style ) => {
		onSelect( { name: style } );
		onHoverClassName( null );
		setHoveredStyle( null );
		debouncedSetHoveredStyle.cancel();
	};

	const hoverStyleHandler = ( style ) => {
		if ( hoveredStyle === style ) {
			debouncedSetHoveredStyle.cancel();
			return;
		}

		debouncedSetHoveredStyle( style );
		onHoverClassName( style?.name ?? null );
	};

	const renderSelectedBlockStlye = ( currentStyle ) => {
		const currentBlockStyle = stylesToRender.find(
			( style ) => style.name === currentStyle
		);

		if ( ! currentBlockStyle ) {
			return null;
		}

		return <BlockStyleItem blockStyle={ currentBlockStyle } />;
	};

	const defaultStyle = getDefaultStyle( stylesToRender );

	return (
		<div className="block-editor-block-styles">
			<CustomSelect
				className="block-editor-block-styles__button"
				defaultValue={ defaultStyle?.name }
				label={ __( 'Select a block style' ) }
				onChange={ handleOnChange }
				renderSelectedValue={ renderSelectedBlockStlye }
				value={ activeStyle?.name }
				hideLabelFromVision
				popoverProps={ {
					wrapperProps: { style: { zIndex: 1000000 } },
				} }
			>
				{ stylesToRender.map( ( blockStyle, index ) => (
					<CustomSelectItem
						key={ index }
						value={ blockStyle.name }
						onMouseEnter={ () => hoverStyleHandler( blockStyle ) }
						onMouseLeave={ () => hoverStyleHandler( null ) }
						onFocus={ () => hoverStyleHandler( blockStyle ) }
						onBlur={ () => hoverStyleHandler( null ) }
					>
						<BlockStyleItem blockStyle={ blockStyle } />
					</CustomSelectItem>
				) ) }
			</CustomSelect>
			{ hoveredStyle && ! isMobileViewport && (
				<Popover
					placement="left-start"
					offset={ 34 }
					focusOnMount={ false }
				>
					<div
						className="block-editor-block-styles__preview-panel"
						onMouseLeave={ () => hoverStyleHandler( null ) }
					>
						<BlockStylesPreviewPanel
							activeStyle={ activeStyle }
							className={ previewClassName }
							genericPreviewBlock={ genericPreviewBlock }
							style={ hoveredStyle }
						/>
					</div>
				</Popover>
			) }
		</div>
	);
}

export default BlockStyles;
