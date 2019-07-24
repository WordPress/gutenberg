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
	const { title, property, device, deviceIcon, clientId, currentSize, onSpacingChange, onReset } = props;

	const dimensionSize = `${ property }Size`;

	const findSizeBySlug = ( sizes, slug ) => sizes.find( ( size ) => slug === size.slug );

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

	const resetSpacing = () => onReset( dimensionSize );

	return (
		<BaseControl
			id={ `block-spacing-${ property }-desktop-${ clientId }` }
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
