/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlockItems,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mapCellsToSections } from './utils';

export default function save( { attributes } ) {
	const { hasFixedLayout, rows } = attributes;

	if ( ! rows.length ) {
		return null;
	}

	const colorProps = getColorClassesAndStyles( attributes );
	const borderProps = getBorderClassesAndStyles( attributes );

	const blockProps = useBlockProps.save();

	const items = useInnerBlockItems.save();
	const sections = mapCellsToSections( rows, items );

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
									{ row.map( ( cell ) => (
										<RawHTML key={ cell.clientId }>
											{ cell.html }
										</RawHTML>
									) ) }
								</tr>
							) ) }
						</Tag>
					);
				} ) }
			</table>
		</figure>
	);
}
