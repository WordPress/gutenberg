/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getColorProps } from './utils';

export default function save( { attributes } ) {
	const { hasFixedLayout, head, body, foot, caption } = attributes;
	const isEmpty = ! head.length && ! body.length && ! foot.length;

	if ( isEmpty ) {
		return null;
	}

	const blockProps = useBlockProps.save();
	const isStripedStyle = blockProps.className.includes( 'is-style-stripes' );

	const colorProps = getColorClassesAndStyles( attributes );
	const borderProps = getBorderClassesAndStyles( attributes );
	const headerProps = getColorProps( 'header', attributes );
	const stripedProps = getColorProps( 'secondary', attributes );
	const footerProps = getColorProps( 'footer', attributes );

	const classes = classnames( colorProps.className, borderProps.className, {
		'has-fixed-layout': hasFixedLayout,
	} );

	const hasCaption = ! RichText.isEmpty( caption );

	const getRowProps = ( name, rowIndex ) => {
		if ( name === 'head' ) {
			return headerProps;
		}

		if ( name === 'foot' ) {
			return footerProps;
		}

		// Striped styling only applies to table body.
		if ( isStripedStyle && rowIndex % 2 === 0 ) {
			return stripedProps;
		}

		return {};
	};

	const Section = ( { type, rows } ) => {
		if ( ! rows.length ) {
			return null;
		}

		const Tag = `t${ type }`;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) => (
					<tr key={ rowIndex } { ...getRowProps( type, rowIndex ) }>
						{ cells.map(
							( { content, tag, scope, align }, cellIndex ) => {
								const cellClasses = classnames( {
									[ `has-text-align-${ align }` ]: align,
								} );

								return (
									<RichText.Content
										className={
											cellClasses
												? cellClasses
												: undefined
										}
										data-align={ align }
										tagName={ tag }
										value={ content }
										key={ cellIndex }
										scope={
											tag === 'th' ? scope : undefined
										}
									/>
								);
							}
						) }
					</tr>
				) ) }
			</Tag>
		);
	};

	return (
		<figure { ...blockProps }>
			<table
				className={ classes === '' ? undefined : classes }
				style={ { ...colorProps.style, ...borderProps.style } }
			>
				<Section type="head" rows={ head } />
				<Section type="body" rows={ body } />
				<Section type="foot" rows={ foot } />
			</table>
			{ hasCaption && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
