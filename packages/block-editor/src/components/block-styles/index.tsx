import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { debounce, useInstanceId } from '@wordpress/compose';
import {
	Composite,
	__experimentalTruncate as Truncate,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	Button,
	Tooltip,
} from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { BlockStyle } from '@wordpress/blocks';
import PreviewBlockPopover from '../block-switcher/preview-block-popover';
import useStylesForBlocks from './use-styles-for-block';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { getDefaultStyle, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';
import type { BlockStylesProps } from './types';

const noop = () => {};

const getCompositeItemId = ( instanceId: string, style: BlockStyle ) =>
	`${ instanceId }-${ style.name }`;

// Block Styles component for the Settings Sidebar.
function BlockStyles( {
	clientId,
	onSwitch = noop,
	onHoverClassName = noop,
}: BlockStylesProps ) {
	const canEdit = useSelect(
		( select ) => select( blockEditorStore ).canEditBlock( clientId ),
		[ clientId ]
	);
	const {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className,
	} = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );
	const [ hoveredStyle, setHoveredStyle ] = useState< BlockStyle | null >(
		null
	);
	const [ blockStylesAnchor, setBlockStylesAnchor ] =
		useState< HTMLDivElement | null >( null );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const instanceId = useInstanceId(
		BlockStyles,
		'block-editor-block-styles'
	);

	const styleRows = useMemo( () => {
		const rows: BlockStyle[][] = [];
		for ( let i = 0; i < ( stylesToRender?.length ?? 0 ); i += 2 ) {
			rows.push( stylesToRender.slice( i, i + 2 ) );
		}
		return rows;
	}, [ stylesToRender ] );

	const previewBlocks = useMemo( () => {
		if ( ! hoveredStyle || ! genericPreviewBlock ) {
			return null;
		}
		const previewClassName = replaceActiveStyle(
			className,
			activeStyle,
			hoveredStyle
		);
		return [
			{
				...genericPreviewBlock,
				attributes: {
					...( genericPreviewBlock.attributes || {} ),
					className: previewClassName,
				},
			},
		];
	}, [ hoveredStyle, genericPreviewBlock, className, activeStyle ] );

	if ( ! canEdit || ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const debouncedSetHoveredStyle = debounce(
		// `debounce` takes callbacks with unknown arguments.
		setHoveredStyle as ( ...args: unknown[] ) => void,
		250
	);

	const onSelectStylePreview = ( style: BlockStyle ) => {
		onSelect( style );
		onHoverClassName( null );
		setHoveredStyle( null );
		debouncedSetHoveredStyle.cancel();
	};

	const styleItemHandler = ( item: BlockStyle | null ) => {
		if ( hoveredStyle === item ) {
			debouncedSetHoveredStyle.cancel();
			return;
		}
		debouncedSetHoveredStyle( item );
		onHoverClassName( item?.name ?? null );
	};

	const onSetActiveId = ( nextActiveId: string | null | undefined ) => {
		const nextStyle = stylesToRender.find(
			( style ) =>
				getCompositeItemId( instanceId, style ) === nextActiveId
		);
		if ( nextStyle && nextStyle.name !== activeStyle.name ) {
			onSelectStylePreview( nextStyle );
		}
	};

	const defaultStyle = getDefaultStyle( stylesToRender );

	const hasValue = () => {
		return activeStyle?.name !== defaultStyle?.name;
	};

	const onDeselect = () => {
		// The rendered styles include a default.
		onSelectStylePreview( defaultStyle! );
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
				<div
					ref={ setBlockStylesAnchor }
					className="block-editor-block-styles"
				>
					<Composite
						role="radiogroup"
						aria-label={ __( 'Styles' ) }
						className="block-editor-block-styles__variants"
						activeId={ getCompositeItemId(
							instanceId,
							activeStyle
						) }
						setActiveId={ onSetActiveId }
						focusLoop
						focusWrap
						focusShift
					>
						{ styleRows.map( ( row, rowIndex ) => (
							<Composite.Row
								key={ rowIndex }
								className="block-editor-block-styles__row"
							>
								{ row.map( ( style ) => (
									<Tooltip.Root key={ style.name }>
										<Composite.Item
											id={ getCompositeItemId(
												instanceId,
												style
											) }
											render={
												<Tooltip.Trigger
													render={
														<Button
															className="block-editor-block-styles__item"
															tone="neutral"
															variant={
																activeStyle.name ===
																style.name
																	? 'solid'
																	: 'outline'
															}
														/>
													}
												/>
											}
											role="radio"
											aria-checked={
												activeStyle.name === style.name
											}
											onMouseEnter={ () =>
												styleItemHandler( style )
											}
											onFocus={ () =>
												styleItemHandler( style )
											}
											onMouseLeave={ () =>
												styleItemHandler( null )
											}
											onBlur={ () =>
												styleItemHandler( null )
											}
											onClick={ () =>
												onSelectStylePreview( style )
											}
										>
											<Truncate
												numberOfLines={ 2 }
												className="block-editor-block-styles__item-text"
											>
												{ style.label || style.name }
											</Truncate>
										</Composite.Item>
										<Tooltip.Popup>
											{ style.label || style.name }
										</Tooltip.Popup>
									</Tooltip.Root>
								) ) }
							</Composite.Row>
						) ) }
					</Composite>
					{ previewBlocks && (
						<PreviewBlockPopover
							blocks={ previewBlocks }
							placement="left-start"
							offset={ 34 }
							anchor={ blockStylesAnchor }
						/>
					) }
				</div>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

export default BlockStyles;
