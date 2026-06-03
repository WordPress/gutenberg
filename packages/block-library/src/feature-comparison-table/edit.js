/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	Button,
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	SelectControl,
	ColorPicker,
	Placeholder,
	BaseControl,
	useBaseControlProps,
	ButtonGroup,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';
import { plus, trash, arrowUp, arrowDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	generateId,
	getCellKey,
	getEffectiveCell,
	buildFootnoteIndex,
	getCellFootnoteLabels,
	ICON_TYPES,
	FEATURE_POSITIONS,
	HEADER_DISPLAY_OPTIONS,
	FOOTNOTE_STYLE_OPTIONS,
	FOOTNOTE_DISPLAY_OPTIONS,
	HOVER_HIGHLIGHT_OPTIONS,
	ROTATION_ANGLE_OPTIONS,
} from './utils';

/**
 * Renders the footnote reference label(s) for a cell in the editor preview.
 *
 * @param {Object} props
 * @param {Array}  props.labels  - Array of footnote label strings.
 * @param {string} props.display - 'superscript' | 'subscript' | 'inline'.
 */
function FootnoteRefs( { labels, display } ) {
	if ( ! labels || labels.length === 0 ) {
		return null;
	}
	const text = labels.join( ',' );
	if ( display === 'superscript' ) {
		return (
			<sup
				className="fct-footnote-ref"
				aria-label={ __( 'Footnote reference' ) }
			>
				{ text }
			</sup>
		);
	}
	if ( display === 'subscript' ) {
		return (
			<sub
				className="fct-footnote-ref"
				aria-label={ __( 'Footnote reference' ) }
			>
				{ text }
			</sub>
		);
	}
	// inline
	return (
		<span className="fct-footnote-ref fct-footnote-ref--inline">
			[{ text }]
		</span>
	);
}

/**
 * Renders the content of a single comparison cell.
 *
 * @param {Object} props
 * @param {Object} props.cell            - Cell data object.
 * @param {Array}  props.footnoteLabels  - Footnote labels for this cell.
 * @param {string} props.footnoteDisplay - Footnote display mode.
 * @param {string} props.iconColor       - Optional icon color override from the row.
 */
function CellContent( { cell, footnoteLabels, footnoteDisplay, iconColor } ) {
	if ( ! cell || cell.type === 'empty' ) {
		return (
			<span
				className="fct-cell-empty"
				aria-label={ __( 'Not applicable' ) }
			/>
		);
	}

	const iconStyle = iconColor ? { color: iconColor } : undefined;

	return (
		<>
			{ cell.type === 'icon' && ICON_TYPES[ cell.value ] && (
				<span
					className={ `fct-cell-icon fct-cell-icon--${ cell.value }` }
					aria-label={ ICON_TYPES[ cell.value ].ariaLabel }
					role="img"
					style={ iconStyle }
				>
					{ ICON_TYPES[ cell.value ].symbol }
				</span>
			) }
			{ cell.type === 'text' && (
				<span className="fct-cell-text">{ cell.text }</span>
			) }
			<FootnoteRefs
				labels={ footnoteLabels }
				display={ footnoteDisplay }
			/>
		</>
	);
}

/**
 * A color picker wrapped in a labelled section. Uses useBaseControlProps to
 * generate a stable ID so the colour picker input is properly labelled.
 *
 * @param {Object}   props
 * @param {string}   props.label    - Visible label text.
 * @param {string}   props.color    - Current color value.
 * @param {Function} props.onChange - Change handler receiving the new color string.
 */
function LabelledColorPicker( { label, color, onChange } ) {
	const { baseControlProps, controlProps } = useBaseControlProps( {} );
	const { id } = baseControlProps;
	return (
		<BaseControl id={ id } label={ label }>
			<ColorPicker
				{ ...controlProps }
				color={ color }
				onChange={ onChange }
				enableAlpha
			/>
		</BaseControl>
	);
}

/**
 * Main edit component for the Feature Comparison Table block.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 */
export default function Edit( { attributes, setAttributes } ) {
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

	// Key of the currently selected cell for editing in the sidebar.
	const [ selectedCellKey, setSelectedCellKey ] = useState( null );
	// ID of the currently selected product for header editing.
	const [ selectedProductId, setSelectedProductId ] = useState( null );

	// Build the footnote index (reading-order labels) derived from current data.
	const footnoteIndex = useMemo(
		() =>
			buildFootnoteIndex(
				features,
				products,
				cells,
				footnotes,
				footnoteStyle
			),
		[ features, products, cells, footnotes, footnoteStyle ]
	);

	const selectedProduct = selectedProductId
		? products.find( ( p ) => p.id === selectedProductId )
		: null;

	// -------------------------------------------------------------------------
	// Products management helpers
	// -------------------------------------------------------------------------

	const addProduct = useCallback( () => {
		const id = generateId();
		setAttributes( {
			products: [
				...products,
				{
					id,
					title: __( 'Product' ),
					imageUrl: '',
					imageId: 0,
					imageAlt: '',
					url: '',
					description: '',
				},
			],
		} );
	}, [ products, setAttributes ] );

	const removeProduct = useCallback(
		( productId ) => {
			const newCells = { ...cells };
			features.forEach( ( f ) => {
				delete newCells[ getCellKey( f.id, productId ) ];
			} );
			setAttributes( {
				products: products.filter( ( p ) => p.id !== productId ),
				cells: newCells,
			} );
			if ( selectedProductId === productId ) {
				setSelectedProductId( null );
			}
		},
		[ products, features, cells, selectedProductId, setAttributes ]
	);

	const updateProduct = useCallback(
		( productId, updates ) => {
			setAttributes( {
				products: products.map( ( p ) =>
					p.id === productId ? { ...p, ...updates } : p
				),
			} );
		},
		[ products, setAttributes ]
	);

	const moveProduct = useCallback(
		( index, direction ) => {
			const newProducts = [ ...products ];
			const swapIndex = index + direction;
			if ( swapIndex < 0 || swapIndex >= newProducts.length ) {
				return;
			}
			[ newProducts[ index ], newProducts[ swapIndex ] ] = [
				newProducts[ swapIndex ],
				newProducts[ index ],
			];
			setAttributes( { products: newProducts } );
		},
		[ products, setAttributes ]
	);

	// -------------------------------------------------------------------------
	// Features management helpers
	// -------------------------------------------------------------------------

	const addFeature = useCallback( () => {
		const id = generateId();
		setAttributes( {
			features: [
				...features,
				{
					id,
					label: __( 'Feature' ),
					url: '',
					defaultValue: 'tick',
					backgroundColor: '',
					textColor: '',
					iconColor: '',
				},
			],
		} );
	}, [ features, setAttributes ] );

	const removeFeature = useCallback(
		( featureId ) => {
			const newCells = { ...cells };
			products.forEach( ( p ) => {
				delete newCells[ getCellKey( featureId, p.id ) ];
			} );
			setAttributes( {
				features: features.filter( ( f ) => f.id !== featureId ),
				cells: newCells,
			} );
		},
		[ features, products, cells, setAttributes ]
	);

	const updateFeature = useCallback(
		( featureId, updates ) => {
			setAttributes( {
				features: features.map( ( f ) =>
					f.id === featureId ? { ...f, ...updates } : f
				),
			} );
		},
		[ features, setAttributes ]
	);

	const moveFeature = useCallback(
		( index, direction ) => {
			const newFeatures = [ ...features ];
			const swapIndex = index + direction;
			if ( swapIndex < 0 || swapIndex >= newFeatures.length ) {
				return;
			}
			[ newFeatures[ index ], newFeatures[ swapIndex ] ] = [
				newFeatures[ swapIndex ],
				newFeatures[ index ],
			];
			setAttributes( { features: newFeatures } );
		},
		[ features, setAttributes ]
	);

	// -------------------------------------------------------------------------
	// Cell editing helpers
	// -------------------------------------------------------------------------

	const updateCell = useCallback(
		( featureId, productId, updates ) => {
			const key = getCellKey( featureId, productId );
			const existing = cells[ key ] || {
				type: 'icon',
				value: 'tick',
				text: '',
				footnoteIds: [],
			};
			setAttributes( {
				cells: { ...cells, [ key ]: { ...existing, ...updates } },
			} );
		},
		[ cells, setAttributes ]
	);

	// -------------------------------------------------------------------------
	// Footnote management helpers
	// -------------------------------------------------------------------------

	const addFootnote = useCallback( () => {
		const id = generateId();
		setAttributes( {
			footnotes: [ ...footnotes, { id, content: '' } ],
		} );
	}, [ footnotes, setAttributes ] );

	const removeFootnote = useCallback(
		( footnoteId ) => {
			// Remove footnote references from all cells when deleting a footnote.
			const newCells = {};
			Object.entries( cells ).forEach( ( [ key, cell ] ) => {
				newCells[ key ] = {
					...cell,
					footnoteIds: ( cell.footnoteIds || [] ).filter(
						( id ) => id !== footnoteId
					),
				};
			} );
			setAttributes( {
				footnotes: footnotes.filter( ( fn ) => fn.id !== footnoteId ),
				cells: newCells,
			} );
		},
		[ footnotes, cells, setAttributes ]
	);

	const updateFootnote = useCallback(
		( footnoteId, content ) => {
			setAttributes( {
				footnotes: footnotes.map( ( fn ) =>
					fn.id === footnoteId ? { ...fn, content } : fn
				),
			} );
		},
		[ footnotes, setAttributes ]
	);

	const toggleCellFootnote = useCallback(
		( featureId, productId, footnoteId ) => {
			const key = getCellKey( featureId, productId );
			const existing = cells[ key ] || {
				type: 'icon',
				value: 'tick',
				text: '',
				footnoteIds: [],
			};
			const ids = existing.footnoteIds || [];
			const newIds = ids.includes( footnoteId )
				? ids.filter( ( id ) => id !== footnoteId )
				: [ ...ids, footnoteId ];
			setAttributes( {
				cells: {
					...cells,
					[ key ]: { ...existing, footnoteIds: newIds },
				},
			} );
		},
		[ cells, setAttributes ]
	);

	// -------------------------------------------------------------------------
	// Derived helpers for selected cell.
	// Cell keys are UUID_UUID. Split on the first underscore to recover the IDs.
	// -------------------------------------------------------------------------

	let selectedCellFeatureId = null;
	let selectedCellProductId = null;
	if ( selectedCellKey ) {
		const sepIndex = selectedCellKey.indexOf( '_' );
		selectedCellFeatureId = selectedCellKey.slice( 0, sepIndex );
		selectedCellProductId = selectedCellKey.slice( sepIndex + 1 );
	}

	const selectedCellData = selectedCellKey
		? getEffectiveCell(
				cells,
				features.find( ( f ) => f.id === selectedCellFeatureId ) || {},
				selectedCellProductId
		  )
		: null;

	const hasContent = products.length > 0 && features.length > 0;

	// -------------------------------------------------------------------------
	// Block props
	// -------------------------------------------------------------------------

	const blockProps = useBlockProps( {
		className: clsx( {
			'has-alternate-row-colors': alternateRowColors,
			[ `has-hover-highlight-${ hoverHighlight }` ]:
				hoverHighlight !== 'none',
			'has-sticky-first-column': stickyFirstColumn,
			'has-rotated-headers': rotateHeaders,
		} ),
		style: {
			'--fct-alt-row-odd': alternateRowColorOdd || undefined,
			'--fct-alt-row-even': alternateRowColorEven || undefined,
			'--fct-header-rotation': rotateHeaders
				? `${ headerRotationAngle }deg`
				: undefined,
		},
	} );

	// -------------------------------------------------------------------------
	// Render helpers
	// -------------------------------------------------------------------------

	/**
	 * Render the inner content for a product column header.
	 *
	 * @param {Object}  product   - Product data object.
	 * @param {boolean} showImage - Whether to show the product image.
	 * @param {boolean} showTitle - Whether to show the product title.
	 */
	const renderProductHeaderInner = ( product, showImage, showTitle ) => (
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

	/**
	 * Render a product column header cell.
	 *
	 * @param {Object} product - Product data object.
	 */
	const renderProductHeader = ( product ) => {
		const isSelected = selectedProductId === product.id;
		const showImage =
			headerDisplay === 'image-only' || headerDisplay === 'image-title';
		const showTitle =
			headerDisplay === 'title' || headerDisplay === 'image-title';

		return (
			<th
				key={ product.id }
				scope="col"
				className={ clsx( 'fct-product-header', {
					'is-selected': isSelected,
				} ) }
				onClick={ () =>
					setSelectedProductId( isSelected ? null : product.id )
				}
			>
				{ product.url ? (
					<a
						href={ product.url }
						className="fct-product-header__link"
						onClick={ ( e ) => e.preventDefault() }
					>
						{ renderProductHeaderInner(
							product,
							showImage,
							showTitle
						) }
					</a>
				) : (
					renderProductHeaderInner( product, showImage, showTitle )
				) }
			</th>
		);
	};

	/**
	 * Render a feature label cell (th with row scope).
	 *
	 * @param {Object} feature - Feature row data object.
	 */
	const renderFeatureLabel = ( feature ) => {
		const labelContent = feature.url ? (
			<a
				href={ feature.url }
				onClick={ ( e ) => e.preventDefault() }
				className="fct-feature-label__link"
			>
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

	/**
	 * Render a comparison data cell.
	 *
	 * @param {Object} feature - Feature row data object.
	 * @param {Object} product - Product column data object.
	 */
	const renderCell = ( feature, product ) => {
		const key = getCellKey( feature.id, product.id );
		const cell = getEffectiveCell( cells, feature, product.id );
		const labels = getCellFootnoteLabels(
			cell.footnoteIds || [],
			footnoteIndex
		);
		const isSelected = selectedCellKey === key;

		return (
			<td
				key={ product.id }
				className={ clsx( 'fct-cell', {
					'is-selected': isSelected,
					[ `fct-cell--${ cell.type }` ]: true,
				} ) }
				onClick={ () => {
					setSelectedCellKey( isSelected ? null : key );
					setSelectedProductId( null );
				} }
			>
				<CellContent
					cell={ cell }
					footnoteLabels={ labels }
					footnoteDisplay={ footnoteDisplay }
					iconColor={ feature.iconColor || undefined }
				/>
			</td>
		);
	};

	// -------------------------------------------------------------------------
	// Inspector Controls
	// -------------------------------------------------------------------------

	const inspectorControls = (
		<InspectorControls>
			{ /* ---- Products panel ---- */ }
			<PanelBody title={ __( 'Products / Columns' ) } initialOpen>
				{ products.map( ( product, index ) => (
					<div key={ product.id } className="fct-inspector-list-item">
						<Flex align="center">
							<FlexBlock>
								<strong className="fct-inspector-list-item__title">
									{ product.title || __( '(untitled)' ) }
								</strong>
							</FlexBlock>
							<FlexItem>
								<ButtonGroup>
									<Button
										__next40pxDefaultSize
										icon={ arrowUp }
										label={ __( 'Move up' ) }
										size="small"
										disabled={ index === 0 }
										accessibleWhenDisabled
										onClick={ () =>
											moveProduct( index, -1 )
										}
									/>
									<Button
										__next40pxDefaultSize
										icon={ arrowDown }
										label={ __( 'Move down' ) }
										size="small"
										disabled={
											index === products.length - 1
										}
										accessibleWhenDisabled
										onClick={ () =>
											moveProduct( index, 1 )
										}
									/>
									<Button
										__next40pxDefaultSize
										icon={ trash }
										label={ __( 'Remove product' ) }
										size="small"
										isDestructive
										onClick={ () =>
											removeProduct( product.id )
										}
									/>
								</ButtonGroup>
							</FlexItem>
						</Flex>
					</div>
				) ) }
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					onClick={ addProduct }
					style={ { marginTop: '8px' } }
				>
					{ __( 'Add product' ) }
				</Button>
			</PanelBody>

			{ /* ---- Features panel ---- */ }
			<PanelBody title={ __( 'Feature Rows' ) }>
				{ features.map( ( feature, index ) => (
					<div key={ feature.id } className="fct-inspector-list-item">
						<Flex align="center">
							<FlexBlock>
								<strong className="fct-inspector-list-item__title">
									{ feature.label || __( '(untitled)' ) }
								</strong>
							</FlexBlock>
							<FlexItem>
								<ButtonGroup>
									<Button
										__next40pxDefaultSize
										icon={ arrowUp }
										label={ __( 'Move up' ) }
										size="small"
										disabled={ index === 0 }
										accessibleWhenDisabled
										onClick={ () =>
											moveFeature( index, -1 )
										}
									/>
									<Button
										__next40pxDefaultSize
										icon={ arrowDown }
										label={ __( 'Move down' ) }
										size="small"
										disabled={
											index === features.length - 1
										}
										accessibleWhenDisabled
										onClick={ () =>
											moveFeature( index, 1 )
										}
									/>
									<Button
										__next40pxDefaultSize
										icon={ trash }
										label={ __( 'Remove feature' ) }
										size="small"
										isDestructive
										onClick={ () =>
											removeFeature( feature.id )
										}
									/>
								</ButtonGroup>
							</FlexItem>
						</Flex>
					</div>
				) ) }
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					onClick={ addFeature }
					style={ { marginTop: '8px' } }
				>
					{ __( 'Add feature row' ) }
				</Button>
			</PanelBody>

			{ /* ---- Selected product editing panel ---- */ }
			{ selectedProduct && (
				<PanelBody
					title={ selectedProduct.title || __( 'Edit product' ) }
					initialOpen
				>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Title' ) }
						value={ selectedProduct.title }
						onChange={ ( val ) =>
							updateProduct( selectedProduct.id, { title: val } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'URL' ) }
						type="url"
						value={ selectedProduct.url }
						placeholder="https://"
						onChange={ ( val ) =>
							updateProduct( selectedProduct.id, { url: val } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Description' ) }
						value={ selectedProduct.description }
						onChange={ ( val ) =>
							updateProduct( selectedProduct.id, {
								description: val,
							} )
						}
					/>
					{ selectedProduct.imageUrl && (
						<div className="fct-product-image-preview">
							<img
								src={ selectedProduct.imageUrl }
								alt={ selectedProduct.imageAlt || '' }
								style={ {
									maxWidth: '100%',
									marginBottom: '8px',
								} }
							/>
							<Button
								__next40pxDefaultSize
								variant="link"
								isDestructive
								onClick={ () =>
									updateProduct( selectedProduct.id, {
										imageUrl: '',
										imageId: 0,
										imageAlt: '',
									} )
								}
							>
								{ __( 'Remove image' ) }
							</Button>
						</div>
					) }
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ ( media ) =>
								updateProduct( selectedProduct.id, {
									imageUrl: media.url,
									imageId: media.id,
									imageAlt: media.alt || '',
								} )
							}
							allowedTypes={ [ 'image' ] }
							value={ selectedProduct.imageId }
							render={ ( { open } ) => (
								<Button
									__next40pxDefaultSize
									variant="secondary"
									onClick={ open }
								>
									{ selectedProduct.imageUrl
										? __( 'Replace image' )
										: __( 'Upload image' ) }
								</Button>
							) }
						/>
					</MediaUploadCheck>
				</PanelBody>
			) }

			{ /* ---- Selected feature editing panel ---- */ }
			{ selectedCellKey &&
				selectedCellFeatureId &&
				( () => {
					const feature = features.find(
						( f ) => f.id === selectedCellFeatureId
					);
					if ( ! feature ) {
						return null;
					}
					return (
						<PanelBody
							title={ feature.label || __( 'Edit feature row' ) }
							initialOpen
						>
							<TextControl
								__next40pxDefaultSize
								label={ __( 'Feature label' ) }
								value={ feature.label }
								onChange={ ( val ) =>
									updateFeature( feature.id, { label: val } )
								}
							/>
							<TextControl
								__next40pxDefaultSize
								label={ __( 'Feature URL (optional)' ) }
								type="url"
								value={ feature.url }
								placeholder="https://"
								onChange={ ( val ) =>
									updateFeature( feature.id, { url: val } )
								}
							/>
							<SelectControl
								__next40pxDefaultSize
								label={ __( 'Row default value' ) }
								value={ feature.defaultValue }
								options={ [
									{ label: __( '(none)' ), value: '' },
									{
										label: __( 'Tick (✓)' ),
										value: 'tick',
									},
									{
										label: __( 'Cross (✕)' ),
										value: 'cross',
									},
									{
										label: __( 'Warning (!)' ),
										value: 'warning',
									},
								] }
								onChange={ ( val ) =>
									updateFeature( feature.id, {
										defaultValue: val,
									} )
								}
								help={ __(
									'New columns inherit this value unless overridden.'
								) }
							/>
						</PanelBody>
					);
				} )() }

			{ /* ---- Selected cell editing panel ---- */ }
			{ selectedCellKey && selectedCellData && (
				<PanelBody title={ __( 'Edit cell' ) } initialOpen>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Cell type' ) }
						value={ selectedCellData.type }
						options={ [
							{ label: __( 'Icon' ), value: 'icon' },
							{ label: __( 'Text' ), value: 'text' },
							{ label: __( 'Empty' ), value: 'empty' },
						] }
						onChange={ ( val ) =>
							updateCell(
								selectedCellFeatureId,
								selectedCellProductId,
								{ type: val }
							)
						}
					/>
					{ selectedCellData.type === 'icon' && (
						<SelectControl
							__next40pxDefaultSize
							label={ __( 'Icon' ) }
							value={ selectedCellData.value }
							options={ Object.entries( ICON_TYPES ).map(
								( [ key, def ] ) => ( {
									label: `${ def.symbol } ${ def.label }`,
									value: key,
								} )
							) }
							onChange={ ( val ) =>
								updateCell(
									selectedCellFeatureId,
									selectedCellProductId,
									{ value: val }
								)
							}
						/>
					) }
					{ selectedCellData.type === 'text' && (
						<TextControl
							__next40pxDefaultSize
							label={ __( 'Text value' ) }
							value={ selectedCellData.text }
							onChange={ ( val ) =>
								updateCell(
									selectedCellFeatureId,
									selectedCellProductId,
									{ text: val }
								)
							}
						/>
					) }
					{ footnotes.length > 0 && (
						<div>
							<p>{ __( 'Footnote references' ) }</p>
							{ footnotes.map( ( fn ) => {
								const ref = footnoteIndex.find(
									( fi ) => fi.id === fn.id
								);
								const isAttached = (
									selectedCellData.footnoteIds || []
								).includes( fn.id );
								return (
									<PanelRow key={ fn.id }>
										<ToggleControl
											label={
												ref
													? `[${ ref.label }] ${
															fn.content ||
															__( '(empty)' )
													  }`
													: fn.content ||
													  __( '(empty)' )
											}
											checked={ isAttached }
											onChange={ () =>
												toggleCellFootnote(
													selectedCellFeatureId,
													selectedCellProductId,
													fn.id
												)
											}
										/>
									</PanelRow>
								);
							} ) }
						</div>
					) }
				</PanelBody>
			) }

			{ /* ---- Display settings panel ---- */ }
			<PanelBody title={ __( 'Display' ) }>
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'Header display' ) }
					value={ headerDisplay }
					options={ HEADER_DISPLAY_OPTIONS }
					onChange={ ( val ) =>
						setAttributes( { headerDisplay: val } )
					}
				/>
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'Feature label position' ) }
					value={ featurePosition }
					options={ FEATURE_POSITIONS }
					onChange={ ( val ) =>
						setAttributes( { featurePosition: val } )
					}
				/>
				<ToggleControl
					label={ __( 'Sticky feature column' ) }
					help={ __(
						'Keep feature labels visible when horizontally scrolling.'
					) }
					checked={ stickyFirstColumn }
					onChange={ ( val ) =>
						setAttributes( { stickyFirstColumn: val } )
					}
				/>
				<ToggleControl
					label={ __( 'Alternate row colors' ) }
					help={ __( 'Zebra striping for easier scanning.' ) }
					checked={ alternateRowColors }
					onChange={ ( val ) =>
						setAttributes( { alternateRowColors: val } )
					}
				/>
				{ alternateRowColors && (
					<>
						<LabelledColorPicker
							label={ __( 'Odd row color' ) }
							color={ alternateRowColorOdd }
							onChange={ ( val ) =>
								setAttributes( { alternateRowColorOdd: val } )
							}
						/>
						<LabelledColorPicker
							label={ __( 'Even row color' ) }
							color={ alternateRowColorEven }
							onChange={ ( val ) =>
								setAttributes( {
									alternateRowColorEven: val,
								} )
							}
						/>
					</>
				) }
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'Hover highlight' ) }
					value={ hoverHighlight }
					options={ HOVER_HIGHLIGHT_OPTIONS }
					onChange={ ( val ) =>
						setAttributes( { hoverHighlight: val } )
					}
				/>
				<ToggleControl
					label={ __( 'Rotate column headers' ) }
					help={ __(
						'Rotate header text to save horizontal space.'
					) }
					checked={ rotateHeaders }
					onChange={ ( val ) =>
						setAttributes( { rotateHeaders: val } )
					}
				/>
				{ rotateHeaders && (
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Rotation angle' ) }
						value={ headerRotationAngle }
						options={ ROTATION_ANGLE_OPTIONS }
						onChange={ ( val ) =>
							setAttributes( {
								headerRotationAngle: Number( val ),
							} )
						}
					/>
				) }
			</PanelBody>

			{ /* ---- Footnotes panel ---- */ }
			<PanelBody title={ __( 'Footnotes' ) }>
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'Label style' ) }
					value={ footnoteStyle }
					options={ FOOTNOTE_STYLE_OPTIONS }
					onChange={ ( val ) =>
						setAttributes( { footnoteStyle: val } )
					}
				/>
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'Display mode' ) }
					value={ footnoteDisplay }
					options={ FOOTNOTE_DISPLAY_OPTIONS }
					onChange={ ( val ) =>
						setAttributes( { footnoteDisplay: val } )
					}
				/>
				{ footnotes.map( ( fn ) => {
					const ref = footnoteIndex.find( ( fi ) => fi.id === fn.id );
					return (
						<div key={ fn.id } className="fct-inspector-list-item">
							<Flex align="flex-start">
								<FlexBlock>
									{ ref && (
										<span className="fct-footnote-number">
											{ ref.label }.{ ' ' }
										</span>
									) }
									<TextControl
										__next40pxDefaultSize
										label={
											ref
												? `${ __( 'Footnote' ) } ${
														ref.label
												  }`
												: __(
														'Footnote (unreferenced)'
												  )
										}
										hideLabelFromVision
										value={ fn.content }
										onChange={ ( val ) =>
											updateFootnote( fn.id, val )
										}
										placeholder={ __( 'Footnote text…' ) }
									/>
								</FlexBlock>
								<FlexItem>
									<Button
										__next40pxDefaultSize
										icon={ trash }
										label={ __( 'Remove footnote' ) }
										size="small"
										isDestructive
										onClick={ () =>
											removeFootnote( fn.id )
										}
									/>
								</FlexItem>
							</Flex>
						</div>
					);
				} ) }
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					onClick={ addFootnote }
					style={ { marginTop: '8px' } }
				>
					{ __( 'Add footnote' ) }
				</Button>
			</PanelBody>
		</InspectorControls>
	);

	// -------------------------------------------------------------------------
	// Main render
	// -------------------------------------------------------------------------

	if ( ! hasContent ) {
		return (
			<>
				{ inspectorControls }
				<div { ...blockProps }>
					<Placeholder
						icon="grid-view"
						label={ __( 'Feature Comparison Table' ) }
						instructions={ __(
							'Add products (columns) and feature rows to build your comparison table.'
						) }
					>
						<Flex>
							<Button
								__next40pxDefaultSize
								variant="primary"
								onClick={ addProduct }
							>
								{ __( 'Add first product' ) }
							</Button>
							{ products.length > 0 && (
								<Button
									__next40pxDefaultSize
									variant="secondary"
									onClick={ addFeature }
								>
									{ __( 'Add first feature' ) }
								</Button>
							) }
						</Flex>
					</Placeholder>
				</div>
			</>
		);
	}

	const showFeatureLeft =
		featurePosition === 'left' || featurePosition === 'both';
	const showFeatureRight =
		featurePosition === 'right' || featurePosition === 'both';

	return (
		<>
			{ inspectorControls }
			<div { ...blockProps }>
				{ /* Scrollable wrapper enables responsive horizontal scrolling */ }
				<div className="fct-table-wrapper">
					<table className="fct-table">
						<thead>
							<tr>
								{ showFeatureLeft && (
									<th
										className={ clsx(
											'fct-feature-header',
											{
												'fct-feature-label--sticky':
													stickyFirstColumn,
											}
										) }
										scope="col"
									>
										<span className="screen-reader-text">
											{ __( 'Feature' ) }
										</span>
									</th>
								) }
								{ products.map( renderProductHeader ) }
								{ showFeatureRight && (
									<th
										className="fct-feature-header"
										scope="col"
									>
										<span className="screen-reader-text">
											{ __( 'Feature' ) }
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

				{ /* Footnotes section */ }
				{ footnoteIndex.length > 0 && (
					<ol
						className="fct-footnotes"
						aria-label={ __( 'Table footnotes' ) }
					>
						{ footnoteIndex.map( ( fn ) => (
							<li
								key={ fn.id }
								id={ `fct-footnote-${ fn.id }` }
								className="fct-footnote"
							>
								{ fn.content || (
									<em>{ __( '(empty footnote)' ) }</em>
								) }
							</li>
						) ) }
					</ol>
				) }
			</div>
		</>
	);
}
