/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	getEffectiveCell,
	buildFootnoteIndex,
	getCellFootnoteLabels,
	ICON_TYPES,
} from './utils';

/**
 * Renders inline footnote references for a cell in the saved output.
 *
 * Links point to the footnote list item at the bottom of the block.
 * No translation functions are used because save() output is persisted to the
 * database and would not update when the site language changes.
 *
 * @param {Object} props
 * @param {Array}  props.labels  - Footnote label strings for this cell.
 * @param {string} props.display - 'superscript' | 'subscript' | 'inline'.
 * @param {string} props.cellId  - Unique ID string for the cell.
 */
function FootnoteRefs( { labels, display, cellId } ) {
	if ( ! labels || labels.length === 0 ) {
		return null;
	}

	const refs = labels.map( ( label, i ) => (
		<a
			key={ i }
			href={ `#fct-footnote-ref-${ label }` }
			className="fct-footnote-ref__link"
			aria-label={ `See footnote ${ label }` }
		>
			{ label }
		</a>
	) );

	if ( display === 'superscript' ) {
		return (
			<sup className="fct-footnote-ref" id={ `fct-cell-fn-${ cellId }` }>
				{ refs }
			</sup>
		);
	}
	if ( display === 'subscript' ) {
		return (
			<sub className="fct-footnote-ref" id={ `fct-cell-fn-${ cellId }` }>
				{ refs }
			</sub>
		);
	}
	// inline
	return (
		<span
			className="fct-footnote-ref fct-footnote-ref--inline"
			id={ `fct-cell-fn-${ cellId }` }
		>
			[{ refs }]
		</span>
	);
}

/**
 * Renders the semantic content of a comparison cell in the saved output.
 *
 * Icon spans are marked aria-hidden; an adjacent screen-reader-only span
 * carries the accessible label so it can be targeted by CSS rather than
 * relying on aria-label (which would require a translated string saved to DB).
 *
 * @param {Object} props
 * @param {Object} props.cell            - Effective cell data.
 * @param {Array}  props.footnoteLabels  - Labels for footnotes referenced by this cell.
 * @param {string} props.footnoteDisplay - Footnote display mode.
 * @param {string} props.cellId          - Unique ID string for the cell.
 * @param {string} props.iconColor       - Optional icon color from the feature row.
 */
function CellContent( {
	cell,
	footnoteLabels,
	footnoteDisplay,
	cellId,
	iconColor,
} ) {
	if ( ! cell || cell.type === 'empty' ) {
		// Visually empty cell; the aria-label describes it to screen readers.
		return <span className="fct-cell-empty" aria-label="Not applicable" />;
	}

	const iconStyle = iconColor ? { color: iconColor } : undefined;

	return (
		<>
			{ cell.type === 'icon' && ICON_TYPES[ cell.value ] && (
				<>
					{ /* Icon glyph hidden from AT; accessible text follows. */ }
					<span
						className={ `fct-cell-icon fct-cell-icon--${ cell.value }` }
						aria-hidden="true"
						style={ iconStyle }
					>
						{ ICON_TYPES[ cell.value ].symbol }
					</span>
					<span className="screen-reader-text">
						{ ICON_TYPES[ cell.value ].ariaLabel }
					</span>
				</>
			) }
			{ cell.type === 'text' && (
				<span className="fct-cell-text">{ cell.text }</span>
			) }
			<FootnoteRefs
				labels={ footnoteLabels }
				display={ footnoteDisplay }
				cellId={ cellId }
			/>
		</>
	);
}

/**
 * Save function for the Feature Comparison Table block.
 *
 * Outputs semantic, accessible table markup from block attributes.
 * All data is stored in block comment attributes; nothing is sourced from the DOM.
 *
 * @param {Object} props
 * @param {Object} props.attributes - Block attributes.
 */
export default function save( { attributes } ) {
	const {
		products,
		features,
		cells,
		footnotes,
		headerDisplay,
		featurePosition,
		stickyFirstColumn,
		alternateRowColors,
		alternateRowColorOdd,
		alternateRowColorEven,
		hoverHighlight,
		rotateHeaders,
		headerRotationAngle,
		footnoteStyle,
		footnoteDisplay,
	} = attributes;

	// Nothing to render if products or features are empty.
	if ( ! products.length || ! features.length ) {
		return null;
	}

	// Build the footnote index (ordered by table reading order).
	const footnoteIndex = buildFootnoteIndex(
		features,
		products,
		cells,
		footnotes,
		footnoteStyle
	);

	const showFeatureLeft =
		featurePosition === 'left' || featurePosition === 'both';
	const showFeatureRight =
		featurePosition === 'right' || featurePosition === 'both';

	// Inline CSS custom properties for alternate row colors and header rotation.
	const wrapperStyle = {
		'--fct-alt-row-odd': alternateRowColorOdd || undefined,
		'--fct-alt-row-even': alternateRowColorEven || undefined,
		'--fct-header-rotation': rotateHeaders
			? `${ headerRotationAngle }deg`
			: undefined,
	};

	const blockProps = useBlockProps.save( {
		className: clsx( {
			'has-alternate-row-colors': alternateRowColors,
			[ `has-hover-highlight-${ hoverHighlight }` ]:
				hoverHighlight !== 'none',
			'has-sticky-first-column': stickyFirstColumn,
			'has-rotated-headers': rotateHeaders,
		} ),
		style: wrapperStyle,
	} );

	// -------------------------------------------------------------------------
	// Header row rendering
	// -------------------------------------------------------------------------

	/**
	 * Render a product column header cell.
	 *
	 * @param {Object} product - Product data object.
	 */
	const renderProductHeader = ( product ) => {
		const showImage =
			headerDisplay === 'image-only' || headerDisplay === 'image-title';
		const showTitle =
			headerDisplay === 'title' || headerDisplay === 'image-title';

		const inner = (
			<>
				{ showImage && product.imageUrl && (
					<img
						src={ product.imageUrl }
						alt={ product.imageAlt || product.title }
						className="fct-product-header__image"
					/>
				) }
				{ showTitle && (
					<span className="fct-product-header__title">
						{ product.title }
					</span>
				) }
				{ product.description && (
					<span className="fct-product-header__description">
						{ product.description }
					</span>
				) }
			</>
		);

		return (
			<th key={ product.id } scope="col" className="fct-product-header">
				{ product.url ? (
					<a
						href={ product.url }
						className="fct-product-header__link"
					>
						{ inner }
					</a>
				) : (
					inner
				) }
			</th>
		);
	};

	// -------------------------------------------------------------------------
	// Feature label cell rendering
	// -------------------------------------------------------------------------

	/**
	 * Render a feature label cell (th with row scope).
	 *
	 * @param {Object} feature - Feature row data object.
	 */
	const renderFeatureLabel = ( feature ) => {
		const labelContent = feature.url ? (
			<a href={ feature.url } className="fct-feature-label__link">
				{ feature.label }
			</a>
		) : (
			feature.label
		);

		return (
			<th
				key={ `label-${ feature.id }` }
				scope="row"
				className={ clsx( 'fct-feature-label', {
					'fct-feature-label--sticky': stickyFirstColumn,
				} ) }
				style={ {
					backgroundColor: feature.backgroundColor || undefined,
					color: feature.textColor || undefined,
				} }
			>
				{ labelContent }
			</th>
		);
	};

	// -------------------------------------------------------------------------
	// Comparison cell rendering
	// -------------------------------------------------------------------------

	/**
	 * Render a comparison cell.
	 *
	 * @param {Object} feature - Feature row data object.
	 * @param {Object} product - Product column data object.
	 */
	const renderCell = ( feature, product ) => {
		const cell = getEffectiveCell( cells, feature, product.id );
		const labels = getCellFootnoteLabels(
			cell.footnoteIds || [],
			footnoteIndex
		);
		const cellId = `${ feature.id }-${ product.id }`;

		return (
			<td
				key={ product.id }
				className={ clsx( 'fct-cell', `fct-cell--${ cell.type }` ) }
			>
				<CellContent
					cell={ cell }
					footnoteLabels={ labels }
					footnoteDisplay={ footnoteDisplay }
					cellId={ cellId }
					iconColor={ feature.iconColor || undefined }
				/>
			</td>
		);
	};

	// -------------------------------------------------------------------------
	// Full table rendering
	// -------------------------------------------------------------------------

	return (
		<div { ...blockProps }>
			{ /* Scrollable wrapper for responsive horizontal scrolling on small screens */ }
			<div className="fct-table-wrapper">
				<table className="fct-table">
					<thead>
						<tr>
							{ showFeatureLeft && (
								<th
									className={ clsx( 'fct-feature-header', {
										'fct-feature-label--sticky':
											stickyFirstColumn,
									} ) }
									scope="col"
								>
									{ /* Visually hidden label for AT without using __() */ }
									<span className="screen-reader-text">
										Feature
									</span>
								</th>
							) }
							{ products.map( renderProductHeader ) }
							{ ( featurePosition === 'right' ||
								featurePosition === 'both' ) && (
								<th className="fct-feature-header" scope="col">
									<span className="screen-reader-text">
										Feature
									</span>
								</th>
							) }
						</tr>
					</thead>
					<tbody>
						{ features.map( ( feature, rowIndex ) => {
							const rowStyle = {};
							if ( feature.backgroundColor ) {
								rowStyle.backgroundColor =
									feature.backgroundColor;
							}
							if ( feature.textColor ) {
								rowStyle.color = feature.textColor;
							}
							// Alternate row colors via inline style.
							if ( alternateRowColors ) {
								if (
									rowIndex % 2 === 0 &&
									alternateRowColorOdd
								) {
									rowStyle.backgroundColor =
										alternateRowColorOdd;
								} else if (
									rowIndex % 2 !== 0 &&
									alternateRowColorEven
								) {
									rowStyle.backgroundColor =
										alternateRowColorEven;
								}
							}

							return (
								<tr
									key={ feature.id }
									style={
										Object.keys( rowStyle ).length
											? rowStyle
											: undefined
									}
								>
									{ showFeatureLeft &&
										renderFeatureLabel( feature ) }
									{ products.map( ( product ) =>
										renderCell( feature, product )
									) }
									{ showFeatureRight &&
										renderFeatureLabel( feature ) }
								</tr>
							);
						} ) }
					</tbody>
				</table>
			</div>

			{ /* Accessible footnotes section, rendered below the table */ }
			{ footnoteIndex.length > 0 && (
				<ol className="fct-footnotes" aria-label="Table footnotes">
					{ footnoteIndex.map( ( fn ) => (
						<li
							key={ fn.id }
							id={ `fct-footnote-ref-${ fn.label }` }
							className="fct-footnote"
						>
							<span
								className="fct-footnote__label"
								aria-hidden="true"
							>
								{ fn.label }.{ ' ' }
							</span>
							{ fn.content }
						</li>
					) ) }
				</ol>
			) }
		</div>
	);
}
