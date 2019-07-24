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
	const { title, property, attributes, setAttributes, clientId } = props;

	const onChangeSpacingSize = ( event ) => {
		const theSize = sizesTable.find( ( size ) => event.target.value === size.slug );

		if ( ! theSize ) {
			return;
		}

		if ( attributes[ `${ property }Size` ] === theSize.slug ) {
			resetSpacing();
		} else {
			setAttributes( {
				[ `${ property }Size` ]: theSize.slug,
				[ `${ property }Top` ]: theSize.size,
				[ `${ property }Right` ]: theSize.size,
				[ `${ property }Left` ]: theSize.size,
				[ `${ property }Bottom` ]: theSize.size,
			} );
		}
	};

	const resetSpacing = () => {
		setAttributes( {
			[ `${ property }Size` ]: '',
			[ `${ property }Top` ]: 0,
			[ `${ property }Right` ]: 0,
			[ `${ property }Left` ]: 0,
			[ `${ property }Bottom` ]: 0,
		} );
	};

	return (
		<BaseControl
			id={ `block-spacing-${ property }-desktop-${ clientId }` }
			help={ sprintf( __( 'Select the %s for this Block' ), property ) }
			className="block-editor-dimension-control"
		>
			<div className="block-editor-dimension-control__header">
				<BaseControl.VisualLabel className="block-editor-dimension-control__header-label">
					<Icon
						icon="desktop"
						label="Desktop"
					/>
					{ sprintf( __( '%s on all devices' ), title ) }
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
				device="desktop"
				onChangeSpacingSize={ onChangeSpacingSize }
			/>

		</BaseControl>
	);
}

export default DimensionControl;
