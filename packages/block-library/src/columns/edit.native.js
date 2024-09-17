/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	FooterMessageControl,
	UnitControl,
	getValueAndUnit,
	alignmentHelpers,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	BlockVariationPicker,
	useSettings,
	store as blockEditorStore,
	useGlobalStyles,
} from '@wordpress/block-editor';
import { withDispatch, useSelect } from '@wordpress/data';
import {
	useEffect,
	useState,
	useMemo,
	useCallback,
	memo,
} from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { columns } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import variations from './variations';
import styles from './editor.scss';
import {
	hasExplicitPercentColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
	getWidths,
	getWidthWithUnit,
	isPercentageUnit,
} from './utils';
import {
	getColumnsInRow,
	calculateContainerWidth,
	getContentWidths,
} from './columnCalculations.native';
import ColumnsPreview from '../column/column-preview';

/**
 * Number of columns to assume for template in case the user opts to skip
 * template option selection.
 *
 * @type {number}
 */
const DEFAULT_COLUMNS_NUM = 2;

/**
 * Minimum number of columns in a row
 *
 * @type {number}
 */
const MIN_COLUMNS_NUM = 1;

const { isFullWidth } = alignmentHelpers;

function ColumnsEditContainer( {
	attributes,
	updateAlignment,
	updateColumns,
	columnCount,
	isSelected,
	onDeleteBlock,
	innerWidths,
	updateInnerColumnWidth,
	editorSidebarOpened,
} ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ columnsInRow, setColumnsInRow ] = useState( MIN_COLUMNS_NUM );
	const screenWidth = Math.floor( Dimensions.get( 'window' ).width );
	const globalStyles = useGlobalStyles();

	const { verticalAlignment, align } = attributes;
	const { width } = sizes || {};

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ '%', 'px', 'em', 'rem', 'vw' ],
	} );

	useEffect( () => {
		if ( columnCount === 0 ) {
			const newColumnCount = columnCount || DEFAULT_COLUMNS_NUM;
			updateColumns( columnCount, newColumnCount );
		}
	}, [] );

	useEffect( () => {
		if ( width ) {
			if ( getColumnsInRow( width, columnCount ) !== columnsInRow ) {
				setColumnsInRow( getColumnsInRow( width, columnCount ) );
			}
		}
	}, [ width, columnCount ] );

	const renderAppender = () => {
		if ( isSelected ) {
			return (
				<View style={ isFullWidth( align ) && styles.columnAppender }>
					<InnerBlocks.ButtonBlockAppender
						onAddBlock={ onAddBlock }
					/>
				</View>
			);
		}
		return null;
	};

	const contentWidths = useMemo(
		() =>
			getContentWidths(
				columnsInRow,
				width,
				columnCount,
				innerWidths,
				globalStyles
			),
		[ width, columnsInRow, columnCount, innerWidths, globalStyles ]
	);

	const onAddBlock = useCallback( () => {
		updateColumns( columnCount, columnCount + 1 );
	}, [ columnCount ] );

	const onChangeWidth = ( nextWidth, valueUnit, columnId ) => {
		const widthWithUnit = getWidthWithUnit( nextWidth, valueUnit );

		updateInnerColumnWidth( widthWithUnit, columnId );
	};

	const onChangeUnit = ( nextUnit, index, columnId ) => {
		const widthWithoutUnit = parseFloat(
			getWidths( innerWidths )[ index ]
		);
		const widthWithUnit = getWidthWithUnit( widthWithoutUnit, nextUnit );

		updateInnerColumnWidth( widthWithUnit, columnId );
	};

	const onChange = ( nextWidth, valueUnit, columnId ) => {
		if ( isPercentageUnit( valueUnit ) || ! valueUnit ) {
			return;
		}
		onChangeWidth( nextWidth, valueUnit, columnId );
	};

	const getColumnsSliders = useMemo( () => {
		if ( ! editorSidebarOpened || ! isSelected ) {
			return null;
		}

		return innerWidths.map( ( column, index ) => {
			const { valueUnit = '%' } =
				getValueAndUnit( column.attributes.width ) || {};
			const label = sprintf(
				/* translators: %d: column index. */
				__( 'Column %d' ),
				index + 1
			);
			return (
				<UnitControl
					label={ label }
					settingLabel={ __( 'Width' ) }
					key={ `${ column.clientId }-${
						getWidths( innerWidths ).length
					}` }
					min={ 1 }
					max={
						isPercentageUnit( valueUnit ) || ! valueUnit
							? 100
							: undefined
					}
					value={ getWidths( innerWidths )[ index ] }
					onChange={ ( nextWidth ) => {
						onChange( nextWidth, valueUnit, column.clientId );
					} }
					onUnitChange={ ( nextUnit ) =>
						onChangeUnit( nextUnit, index, column.clientId )
					}
					onComplete={ ( nextWidth ) => {
						onChangeWidth( nextWidth, valueUnit, column.clientId );
					} }
					unit={ valueUnit }
					units={ units }
					preview={
						<ColumnsPreview
							columnWidths={ getWidths( innerWidths, false ) }
							selectedColumnIndex={ index }
						/>
					}
				/>
			);
		} );
	}, [ editorSidebarOpened, isSelected, innerWidths ] );

	const onChangeColumnsNum = useCallback(
		( value ) => {
			updateColumns( columnCount, value );
		},
		[ columnCount ]
	);

	return (
		<>
			{ isSelected && (
				<>
					<InspectorControls>
						<PanelBody title={ __( 'Columns Settings' ) }>
							<RangeControl
								label={ __( 'Number of columns' ) }
								icon={ columns }
								value={ columnCount }
								onChange={ onChangeColumnsNum }
								min={ MIN_COLUMNS_NUM }
								max={ columnCount + 1 }
								type="stepper"
							/>
							{ getColumnsSliders }
						</PanelBody>
						<PanelBody>
							<FooterMessageControl
								label={ __(
									'Note: Column layout may vary between themes and screen sizes'
								) }
							/>
						</PanelBody>
					</InspectorControls>
					<BlockControls>
						<BlockVerticalAlignmentToolbar
							onChange={ updateAlignment }
							value={ verticalAlignment }
						/>
					</BlockControls>
				</>
			) }
			<View style={ isSelected && styles.innerBlocksSelected }>
				{ resizeListener }
				{ width && (
					<InnerBlocks
						renderAppender={ renderAppender }
						orientation={
							columnsInRow > 1 ? 'horizontal' : undefined
						}
						horizontal={ columnsInRow > 1 }
						contentResizeMode="stretch"
						onAddBlock={ onAddBlock }
						onDeleteBlock={
							columnCount === 1 ? onDeleteBlock : undefined
						}
						blockWidth={ width }
						contentStyle={ contentWidths }
						parentWidth={
							isFullWidth( align ) && columnCount === 0
								? screenWidth
								: calculateContainerWidth( width, columnsInRow )
						}
					/>
				) }
			</View>
		</>
	);
}

const ColumnsEditContainerWrapper = withDispatch(
	( dispatch, ownProps, registry ) => ( {
		/**
		 * Update all child Column blocks with a new vertical alignment setting
		 * based on whatever alignment is passed in. This allows change to parent
		 * to overide anything set on a individual column basis.
		 *
		 * @param {string} verticalAlignment the vertical alignment setting
		 */
		updateAlignment( verticalAlignment ) {
			const { clientId, setAttributes } = ownProps;
			const { updateBlockAttributes } = dispatch( blockEditorStore );
			const { getBlockOrder } = registry.select( blockEditorStore );

			// Update own alignment.
			setAttributes( { verticalAlignment } );

			// Update all child Column Blocks to match.
			const innerBlockClientIds = getBlockOrder( clientId );
			innerBlockClientIds.forEach( ( innerBlockClientId ) => {
				updateBlockAttributes( innerBlockClientId, {
					verticalAlignment,
				} );
			} );
		},
		updateInnerColumnWidth( value, columnId ) {
			const { updateBlockAttributes } = dispatch( blockEditorStore );

			updateBlockAttributes( columnId, {
				width: value,
			} );
		},
		/**
		 * Updates the column columnCount, including necessary revisions to child Column
		 * blocks to grant required or redistribute available space.
		 *
		 * @param {number} previousColumns Previous column columnCount.
		 * @param {number} newColumns      New column columnCount.
		 */
		updateColumns( previousColumns, newColumns ) {
			const { clientId } = ownProps;
			const { replaceInnerBlocks } = dispatch( blockEditorStore );
			const { getBlocks, getBlockAttributes } =
				registry.select( blockEditorStore );

			let innerBlocks = getBlocks( clientId );
			const hasExplicitWidths =
				hasExplicitPercentColumnWidths( innerBlocks );

			// Redistribute available width for existing inner blocks.
			const isAddingColumn = newColumns > previousColumns;

			// Get verticalAlignment from Columns block to set the same to new Column.
			const { verticalAlignment } = getBlockAttributes( clientId ) || {};

			if ( isAddingColumn && hasExplicitWidths ) {
				// If adding a new column, assign width to the new column equal to
				// as if it were `1 / columns` of the total available space.
				const newColumnWidth = toWidthPrecision( 100 / newColumns );

				// Redistribute in consideration of pending block insertion as
				// constraining the available working width.
				const widths = getRedistributedColumnWidths(
					innerBlocks,
					100 - newColumnWidth
				);

				innerBlocks = [
					...getMappedColumnWidths( innerBlocks, widths ),
					...Array.from( {
						length: newColumns - previousColumns,
					} ).map( () => {
						return createBlock( 'core/column', {
							width: `${ newColumnWidth }%`,
							verticalAlignment,
						} );
					} ),
				];
			} else if ( isAddingColumn ) {
				innerBlocks = [
					...innerBlocks,
					...Array.from( {
						length: newColumns - previousColumns,
					} ).map( () => {
						return createBlock( 'core/column', {
							verticalAlignment,
						} );
					} ),
				];
			} else {
				// The removed column will be the last of the inner blocks.
				innerBlocks = innerBlocks.slice(
					0,
					-( previousColumns - newColumns )
				);

				if ( hasExplicitWidths ) {
					// Redistribute as if block is already removed.
					const widths = getRedistributedColumnWidths(
						innerBlocks,
						100
					);

					innerBlocks = getMappedColumnWidths( innerBlocks, widths );
				}
			}

			replaceInnerBlocks( clientId, innerBlocks );
		},
		onAddNextColumn: () => {
			const { clientId } = ownProps;
			const { replaceInnerBlocks, selectBlock } =
				dispatch( blockEditorStore );
			const { getBlocks, getBlockAttributes } =
				registry.select( blockEditorStore );

			// Get verticalAlignment from Columns block to set the same to new Column.
			const { verticalAlignment } = getBlockAttributes( clientId );

			const innerBlocks = getBlocks( clientId );

			const insertedBlock = createBlock( 'core/column', {
				verticalAlignment,
			} );

			replaceInnerBlocks(
				clientId,
				[ ...innerBlocks, insertedBlock ],
				true
			);
			selectBlock( insertedBlock.clientId );
		},
		onDeleteBlock: () => {
			const { clientId } = ownProps;
			const { removeBlock } = dispatch( blockEditorStore );
			removeBlock( clientId );
		},
	} )
)( memo( ColumnsEditContainer ) );

const ColumnsEdit = ( props ) => {
	const { clientId, isSelected, style } = props;
	const {
		columnCount,
		isDefaultColumns,
		innerBlocks,
		hasParents,
		parentBlockAlignment,
		editorSidebarOpened,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlocks,
				getBlockParents,
				getBlockAttributes,
			} = select( blockEditorStore );
			const { isEditorSidebarOpened } = select( 'core/edit-post' );

			const innerBlocksList = getBlocks( clientId );

			const isContentEmpty = innerBlocksList.every(
				( innerBlock ) => innerBlock.innerBlocks.length === 0
			);

			const parents = getBlockParents( clientId, true );

			return {
				columnCount: getBlockCount( clientId ),
				isDefaultColumns: isContentEmpty,
				innerBlocks: innerBlocksList,
				hasParents: parents.length > 0,
				parentBlockAlignment: getBlockAttributes( parents[ 0 ] )?.align,
				editorSidebarOpened: isSelected && isEditorSidebarOpened(),
			};
		},
		[ clientId, isSelected ]
	);

	const innerWidths = useMemo(
		() =>
			innerBlocks.map( ( inn ) => ( {
				clientId: inn.clientId,
				attributes: { width: inn.attributes.width },
			} ) ),
		[ innerBlocks ]
	);

	const [ isVisible, setIsVisible ] = useState( false );

	useEffect( () => {
		if ( isSelected && isDefaultColumns ) {
			const revealTimeout = setTimeout( () => setIsVisible( true ), 100 );

			return () => clearTimeout( revealTimeout );
		}
	}, [] );

	const onClose = useCallback( () => {
		setIsVisible( false );
	}, [] );

	return (
		<View style={ style }>
			<ColumnsEditContainerWrapper
				columnCount={ columnCount }
				innerWidths={ innerWidths }
				hasParents={ hasParents }
				parentBlockAlignment={ parentBlockAlignment }
				editorSidebarOpened={ editorSidebarOpened }
				{ ...props }
			/>
			<BlockVariationPicker
				variations={ variations }
				onClose={ onClose }
				clientId={ clientId }
				isVisible={ isVisible }
			/>
		</View>
	);
};

export default ColumnsEdit;
