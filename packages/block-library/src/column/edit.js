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
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	RadioControl,
	Notice,
} from '@wordpress/components';
import { withDispatch, withSelect, useSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { toWidthPrecision } from '../columns/utils';

/**
 * Component which renders a notice if the sum total width of columns of the
 * root block (the Columns parent) are all explicitly assigned and not equal
 * to 100%.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Client ID of the selected column.
 *
 * @return {WPElement?} Notice element, if invalid.
 */
function InvalidWidthNotice( { clientId } ) {
	const sumWidth = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockAttributes,
				getBlockRootClientId,
			} = select( 'core/block-editor' );

			const columns = getBlockOrder( getBlockRootClientId( clientId ) );
			return columns.reduce(
				( result, columnClientId ) =>
					result + getBlockAttributes( columnClientId ).width,
				0
			);
		},
		[ clientId ]
	);

	// A value of `NaN` is anticipated when any of the columns do not have an
	// explicit width assigned, since `result + undefined` in the `Array#reduce`
	// above would taint the numeric result (intended and leveraged here). Round
	// sum to allow some tolerance +/- 0.5%, which also ensures that the notice
	// message would never display "100%" as an invalid width if e.g. 100.4%
	// sum total width.
	if ( isNaN( sumWidth ) || Math.round( sumWidth ) === 100 ) {
		return null;
	}

	return (
		<Notice status="warning" isDismissible={ false }>
			{ sprintf(
				__( 'The total width of columns (%d%%) does not equal 100%%.' ),
				Math.round( sumWidth )
			) }
		</Notice>
	);
}

function ColumnEdit( {
	clientId,
	attributes,
	setAttributes,
	className,
	updateAlignment,
	hasChildBlocks,
	totalColumns,
} ) {
	const { verticalAlignment, width } = attributes;
	const hasExplicitWidth = width !== undefined;

	const classes = classnames( className, 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<div className={ classes }>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<RadioControl
						label={ __( 'Width' ) }
						selected={ hasExplicitWidth ? 'manual' : 'auto' }
						options={ [
							{
								label: __(
									'Automatically adjust to occupy available space'
								),
								value: 'auto',
							},
							{
								label: __( 'Manual width' ),
								value: 'manual',
							},
						] }
						onChange={ ( nextValue ) => {
							setAttributes( {
								width:
									nextValue === 'manual'
										? toWidthPrecision( 100 / totalColumns )
										: undefined,
							} );
						} }
					/>
					{ hasExplicitWidth && (
						<>
							<RangeControl
								label={ __( 'Percentage width' ) }
								value={ width }
								onChange={ ( nextWidth ) => {
									setAttributes( { width: nextWidth } );
								} }
								min={ 0 }
								max={ 100 }
								step={ 0.1 }
								required
							/>
							<InvalidWidthNotice clientId={ clientId } />
						</>
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
			/>
		</div>
	);
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const { clientId } = ownProps;
		const { getBlockOrder, getBlockRootClientId } = select(
			'core/block-editor'
		);

		return {
			hasChildBlocks: getBlockOrder( clientId ).length > 0,
			totalColumns: getBlockOrder( getBlockRootClientId( clientId ) )
				.length,
		};
	} ),
	withDispatch( ( dispatch, ownProps, registry ) => {
		return {
			updateAlignment( verticalAlignment ) {
				const { clientId, setAttributes } = ownProps;
				const { updateBlockAttributes } = dispatch(
					'core/block-editor'
				);
				const { getBlockRootClientId } = registry.select(
					'core/block-editor'
				);

				// Update own alignment.
				setAttributes( { verticalAlignment } );

				// Reset Parent Columns Block
				const rootClientId = getBlockRootClientId( clientId );
				updateBlockAttributes( rootClientId, {
					verticalAlignment: null,
				} );
			},
		};
	} )
)( ColumnEdit );
