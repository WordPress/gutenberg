/**
 * External dependencies
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function DimensionControl( { type, attributes, setAttributes, clientId } ) {
	const humanType = startCase( type );

	const sizesTable = [
		{
			name: __( 'None' ),
			size: 0,
			slug: 'none',
		},
		{
			name: __( 'Small' ),
			size: 14,
			slug: 'small',
		},
		{
			name: __( 'Medium' ),
			size: 24,
			slug: 'medium',
		},
		{
			name: __( 'Large' ),
			size: 34,
			slug: 'large',
		}, {
			name: __( 'Huge' ),
			size: 60,
			slug: 'huge',
		},
	];

	const onChangeSpacing = ( event ) => {
		const theSize = sizesTable.find( ( size ) => event.target.value === size.slug );

		if ( ! theSize ) {
			return;
		}

		const size = theSize.size;

		// if ( value === '' || value === 'none' ) {
		// 	// resetValue();
		// 	return;
		// }

		setAttributes( {
			[ `${ type }Top` ]: size,
			[ `${ type }Right` ]: size,
			[ `${ type }Left` ]: size,
			[ `${ type }Bottom` ]: size,
		} );
	};

	// Todo - update with unique Block instance ID?
	const controlId = `block-spacing-${ type }-${ clientId }`;

	return (
		<BaseControl
			id={ controlId }
			help={ `Select the ${ type } for this Block` }
			className="block-dimension-control"
		>
			<BaseControl.VisualLabel>
				{ humanType }
			</BaseControl.VisualLabel>
			<ButtonGroup
				id={ controlId }
				className="block-dimension-control__buttons"
			>
				{ sizesTable.map( function( size ) {
					const visualName = size.name.substring( 0, 1 );
					const hiddenName = size.name.substring( 1 );
					const isSelected = attributes[ `${ type }Top` ] === size.size;
					return (
						<Button
							className="block-dimension-control__button"
							key={ size.slug }
							isDefault={ ! isSelected }
							isPrimary={ isSelected }
							value={ size.slug }
							onClick={ onChangeSpacing }
						>
							{ visualName }<span className="screen-reader-text">{ hiddenName }</span>
						</Button>
					);
				} ) }
			</ButtonGroup>
		</BaseControl>
	);
}

export default DimensionControl;
