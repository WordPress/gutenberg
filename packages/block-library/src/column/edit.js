/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, Notice } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function ColumnEdit( {
	attributes: { verticalAlignment, width },
	setAttributes,
	clientId,
} ) {
	const classes = classnames( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const { hasChildBlocks, rootClientId } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockRootClientId } = select(
				'core/block-editor'
			);

			return {
				hasChildBlocks: getBlockOrder( clientId ).length > 0,
				rootClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const updateAlignment = ( value ) => {
		// Update own alignment.
		setAttributes( { verticalAlignment: value } );
		// Reset parent Columns block.
		updateBlockAttributes( rootClientId, {
			verticalAlignment: null,
		} );
	};

	const hasWidth = ( isNaN( width ) && width ) || Number.isFinite( width );

	const isWidthValid = () => {
		const validUnits = [
			'fr',
			'rem',
			'em',
			'ex',
			'%',
			'px',
			'cm',
			'mm',
			'in',
			'pt',
			'pc',
			'ch',
			'vh',
			'vw',
			'vmin',
			'vmax',
		];

		// Return true for values that can be passed-on as-is.
		if (
			! width ||
			[ '0', 'auto', 'inherit', 'initial' ].includes( width )
		) {
			return true;
		}

		// Skip checking if calc() or val().
		if (
			( 0 <= width.indexOf( 'calc(' ) && 0 <= width.indexOf( ')' ) ) ||
			( 0 <= width.indexOf( 'var(--' ) && 0 <= width.indexOf( ')' ) )
		) {
			return true;
		}

		// Get the numeric value.
		const numericValue = parseFloat( width );

		// Get the unit
		const unit = width.replace( numericValue, '' );

		// Do not allow unitless.
		if ( ! unit ) {
			return false;
		}

		// Check the validity of the numeric value and units.
		return ! isNaN( numericValue ) && -1 !== validUnits.indexOf( unit );
	};

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<TextControl
						label={ __( 'Width' ) }
						value={ width || '' }
						onChange={ ( nextWidth ) => {
							setAttributes( { width: nextWidth } );
						} }
						placeholder={
							width === undefined ? __( 'Auto' ) : undefined
						}
					/>
					{ ! isWidthValid() && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Invalid CSS value. Values should include a number and a unit. Example: 30%, 100px, 20em etc.'
							) }
						</Notice>
					) }
				</PanelBody>
			</InspectorControls>
			<InnerBlocks
				templateLock={ false }
				renderAppender={
					hasChildBlocks
						? undefined
						: () => <InnerBlocks.ButtonBlockAppender />
				}
				__experimentalTagName={ Block.div }
				__experimentalPassedProps={ {
					className: classes,
					style: hasWidth ? { flexBasis: width } : undefined,
				} }
			/>
		</>
	);
}

export default ColumnEdit;
