/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockStylesMenuItems from '../block-styles/menu-items';
import useStylesForBlocks from '../block-styles/use-styles-for-block';
import { replaceActiveStyle } from '../block-styles/utils';
import PreviewBlockPopover from './preview-block-popover';

export default function BlockStylesMenu( { hoveredBlock, onSwitch } ) {
	const { clientId } = hoveredBlock;
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
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

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	return (
		<MenuGroup
			label={ __( 'Styles' ) }
			className="block-editor-block-switcher__styles__menugroup"
		>
			{ previewBlocks && (
				<PreviewBlockPopover blocks={ previewBlocks } />
			) }
			<BlockStylesMenuItems
				stylesToRender={ stylesToRender }
				activeStyle={ activeStyle }
				onSelect={ onSelect }
				onHoverStyle={ setHoveredStyle }
			/>
		</MenuGroup>
	);
}
