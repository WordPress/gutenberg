/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { debounce, useViewportMatch } from '@wordpress/compose';
import {
	Button,
	__experimentalTruncate as Truncate,
	Popover,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockStylesPreviewPanel from './preview-panel';
import useStylesForBlocks from './use-styles-for-block';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { getDefaultStyle } from './utils';

const noop = () => {};

// Block Styles component for the Settings Sidebar.
function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
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
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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

	const defaultStyle = getDefaultStyle( stylesToRender );

	const hasValue = () => {
		return activeStyle?.name !== defaultStyle?.name;
	};

	const onDeselect = () => {
		onSelectStylePreview( defaultStyle );
	};

	return (
		<ToolsPanel
			label={ __( 'Styles' ) }
			resetAll={ onDeselect }
			panelId={ clientId }
			hasInnerWrapper
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ hasValue }
				label={ __( 'Variation' ) }
				onDeselect={ onDeselect }
				isShownByDefault
				panelId={ clientId }
			>
				<div className="block-editor-block-styles">
					<div className="block-editor-block-styles__variants">
						{ stylesToRender.map( ( style ) => {
							const buttonText = style.label || style.name;

							return (
								<Button
									__next40pxDefaultSize
									className={ clsx(
										'block-editor-block-styles__item',
										{
											'is-active':
												activeStyle.name === style.name,
										}
									) }
									key={ style.name }
									variant="secondary"
									label={ buttonText }
									onMouseEnter={ () =>
										styleItemHandler( style )
									}
									onFocus={ () => styleItemHandler( style ) }
									onMouseLeave={ () =>
										styleItemHandler( null )
									}
									onBlur={ () => styleItemHandler( null ) }
									onClick={ () =>
										onSelectStylePreview( style )
									}
									aria-current={
										activeStyle.name === style.name
									}
								>
									<Truncate
										numberOfLines={ 1 }
										className="block-editor-block-styles__item-text"
									>
										{ buttonText }
									</Truncate>
								</Button>
							);
						} ) }
					</div>
					{ hoveredStyle && ! isMobileViewport && (
						<Popover
							placement="left-start"
							offset={ 34 }
							focusOnMount={ false }
						>
							<div
								className="block-editor-block-styles__preview-panel"
								onMouseLeave={ () => styleItemHandler( null ) }
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
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

export default BlockStyles;
