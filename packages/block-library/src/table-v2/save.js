/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import {
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mapCellsToSections } from './utils';

export default function save( { attributes, innerBlocks } ) {
	const { hasFixedLayout, rows } = attributes;

	if ( ! rows.length || ! innerBlocks?.length ) {
		return null;
	}

	const colorProps = getColorClassesAndStyles( attributes );
	const borderProps = getBorderClassesAndStyles( attributes );

	const blockProps = useBlockProps.save();

	const sections = mapCellsToSections( rows, innerBlocks );

	return (
		<figure { ...blockProps }>
			<table
				className={ clsx( colorProps.className, borderProps.className, {
					'has-fixed-layout': hasFixedLayout,
				} ) }
				style={ { ...colorProps.style, ...borderProps.style } }
			>
				{ sections.map( ( section ) => {
					const Tag = `t${ section.name }`;
					return (
						<Tag key={ section.name }>
							{ section.rows.map( ( row, rowIndex ) => (
								<tr key={ rowIndex }>
									<RawHTML>
										{ serialize( row, {
											isInnerBlocks: true,
										} ) }
									</RawHTML>
								</tr>
							) ) }
						</Tag>
					);
				} ) }
			</table>
		</figure>
	);
}
