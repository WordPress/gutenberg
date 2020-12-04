/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import { useRef } from '@wordpress/element';

function MarqueeBlock( { attributes, isSelected, setAttributes } ) {
	const { content, behavior, direction, loop } = attributes;
	const ref = useRef();
	const blockProps = useBlockProps( {
		ref,
	} );
	const icons = {
		left: 'arrow-left-alt',
		right: 'arrow-right-alt',
		down: 'arrow-down-alt',
		up: 'arrow-up-alt',
		scroll: 'arrow-right',
		slide: 'controls-skipforward',
		alternate: 'leftright',
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup
					icon={ icons[ direction ] }
					label={ __( 'Change direction' ) }
					isCollapsed
					controls={ [
						{
							icon: icons.left,
							title: __( 'Left' ),
							isActive: 'left' === direction,
							onClick: () =>
								setAttributes( { direction: 'left' } ),
						},
						{
							icon: icons.right,
							title: __( 'Right' ),
							isActive: 'right' === direction,
							onClick: () =>
								setAttributes( { direction: 'right' } ),
						},
						{
							icon: icons.up,
							title: __( 'Up' ),
							isActive: 'up' === direction,
							onClick: () => setAttributes( { direction: 'up' } ),
						},
						{
							icon: icons.down,
							title: __( 'Down' ),
							isActive: 'down' === direction,
							onClick: () =>
								setAttributes( { direction: 'down' } ),
						},
					] }
				/>
				<ToolbarGroup
					icon={ icons[ behavior ] }
					label={ __( 'Change behavior' ) }
					isCollapsed
					controls={ [
						{
							icon: icons.scroll,
							title: __( 'Scroll' ),
							isActive: 'scroll' === behavior,
							onClick: () =>
								setAttributes( { behavior: 'scroll' } ),
						},
						{
							icon: icons.slide,
							title: __( 'Slide' ),
							isActive: 'slide' === behavior,
							onClick: () =>
								setAttributes( { behavior: 'slide' } ),
						},
						{
							icon: icons.alternate,
							title: __( 'Alternate' ),
							isActive: 'alternate' === behavior,
							onClick: () =>
								setAttributes( { behavior: 'alternate' } ),
						},
					] }
				/>
			</BlockControls>
			<InspectorControls>sadfas</InspectorControls>
			<RichText
				identifier="content"
				tagName={ isSelected ? 'p' : 'marquee' }
				{ ...blockProps }
				behavior={ behavior }
				direction={ direction }
				loop={ loop }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
				aria-label={ __( 'Marquee block' ) }
				placeholder={ __( 'Start writing' ) }
			/>
		</>
	);
}

export default MarqueeBlock;
