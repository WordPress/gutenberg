/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { debounce } from '@wordpress/compose';
import {
	Button,
	__experimentalTruncate as Truncate,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewBlockPopover from '../block-switcher/preview-block-popover';
import useStylesForBlocks from './use-styles-for-block';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { getDefaultStyle, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';

const noop = () => {};

// Block Styles component for the Settings Sidebar.
function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
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
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const [ blockStylesAnchor, setBlockStylesAnchor ] = useState( null );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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
				<div
					ref={ setBlockStylesAnchor }
					className="block-editor-block-styles"
				>
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
