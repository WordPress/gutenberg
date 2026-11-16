import clsx from 'clsx';
import { Icon as WCIcon } from '@wordpress/components';
import type { IconType } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { memo } from '@wordpress/element';
import type { CSSProperties } from 'react';
import type { BlockTypeIconDescriptor } from '@wordpress/blocks';
import type { BlockIconProps } from './types';

function BlockIcon( {
	icon,
	showColors = false,
	className,
	context,
}: BlockIconProps ) {
	if ( ( icon as BlockTypeIconDescriptor )?.src === 'block-default' ) {
		icon = {
			src: blockDefault,
		};
	}

	const renderedIcon = (
		<WCIcon
			icon={
				( icon && ( icon as BlockTypeIconDescriptor ).src
					? ( icon as BlockTypeIconDescriptor ).src
					: icon ) as IconType
			}
			// @ts-expect-error `Icon` passes extra props through to the icon.
			context={ context }
		/>
	);
	const style = showColors
		? {
				backgroundColor:
					icon && ( icon as BlockTypeIconDescriptor ).background,
				color: icon && ( icon as BlockTypeIconDescriptor ).foreground,
			}
		: {};

	return (
		<span
			style={ style as CSSProperties }
			className={ clsx( 'block-editor-block-icon', className, {
				'has-colors': showColors,
			} ) }
		>
			{ renderedIcon }
		</span>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-icon/README.md
 */
export default memo( BlockIcon );
