/**
 * WordPress dependencies
 */
import {
	BaseControl,
	IconButton,
	Icon,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import sizesTable from './sizes';
import DimensionButtons from './buttons';

function DimensionControl( props ) {
	const { title, property, device, deviceIcon, id, currentSize, onSpacingChange, onReset } = props;

	const dimensionSize = `${ property }Size`;

	/**
	 * Finds the correct size object from the provided sizes
	 * table by size slug (eg: `medium`)
	 * @param  {Array} sizes containing objects for each size definition
	 * @param  {string} slug a string representation of the size (eg: `medium`)
	 * @return {Object}       the matching size definition
	 */
	const findSizeBySlug = ( sizes, slug ) => sizes.find( ( size ) => slug === size.slug );

	/**
	 * Determines the size from the size slug (eg: `medium`)
	 * and decides whether to call the change or reset callback
	 * handlers
	 * @param  {Object} event the click event for size buttons
	 * @return {void}
	 */
	const onChangeSpacingSize = ( event ) => {
		const theSize = findSizeBySlug( sizesTable, event.target.value );

		if ( ! theSize ) {
			return;
		}

		if ( currentSize === theSize.slug ) {
			resetSpacing();
		} else {
			onSpacingChange( dimensionSize, theSize.slug );
		}
	};

	/**
	 * Applies the callback to handle resetting
	 * a dimension spacing values
	 * @return {void}
	 */
	const resetSpacing = () => onReset( dimensionSize );

	return (
		<BaseControl
			id={ `block-spacing-${ property }-desktop-${ id }` }
			help={ sprintf( __( 'Select the %s for this Block' ), property ) }
			className="block-editor-dimension-control"
		>
			<div className="block-editor-dimension-control__header">
				<BaseControl.VisualLabel className="block-editor-dimension-control__header-label">
					<Icon
						icon={ deviceIcon || device }
						label={ device }
					/>
					{ sprintf( __( '%s (%s devices)' ), title, device ) }
				</BaseControl.VisualLabel>

				<IconButton
					icon="controls-repeat"
					label={ sprintf( __( 'Reset %s' ), title ) }
					isDefault
					isSmall
					onClick={ resetSpacing }
				/>
			</div>

			<DimensionButtons
				{ ...props }
				device={ device }
				currentSize={ currentSize }
				onChangeSpacingSize={ onChangeSpacingSize }
			/>

		</BaseControl>
	);
}

export default DimensionControl;
