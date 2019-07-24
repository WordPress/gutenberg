/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	BaseControl,
	Tooltip,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import sizesTable from './sizes';

function DimensionControl( { title, property, attributes, setAttributes, clientId } ) {
	const onChangeSpacingSize = ( event ) => {
		const theSize = sizesTable.find( ( size ) => event.target.value === size.slug );

		if ( ! theSize ) {
			return;
		}

		if ( attributes[ `${ property }Size` ] === theSize.slug ) {
			setAttributes( {
				[ `${ property }Size` ]: '',
				[ `${ property }Top` ]: 0,
				[ `${ property }Right` ]: 0,
				[ `${ property }Left` ]: 0,
				[ `${ property }Bottom` ]: 0,
			} );
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

	// Todo - update with unique Block instance ID?
	const controlId = `block-spacing-${ property }-${ clientId }`;

	return (
		<BaseControl
			id={ controlId }
			help={ sprintf( __( 'Select the %s for this Block' ), property ) }
			className="block-editor-dimension-control"
		>
			<BaseControl.VisualLabel>
				{ title }
			</BaseControl.VisualLabel>
			<ButtonGroup
				id={ controlId }
				className="block-editor-dimension-control__buttons"
			>
				{ sizesTable.map( function( size ) {
					const visualName = size.name.substring( 0, 1 );
					const hiddenName = size.name.substring( 1 );
					const isSelected = attributes[ `${ property }Size` ] === size.slug;

					let innerButton = (
						<Fragment>
							{ visualName }
							<span className="screen-reader-text">{ hiddenName }</span>
						</Fragment>
					);

					// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
					if ( size.abbr ) {
						innerButton = (
							<abbr title={ size.abbr }>
								{ innerButton }
							</abbr>
						);
					}

					return (
						<Tooltip key={ size.slug } text={ size.name }>
							<Button
								className="block-editor-dimension-control__button"
								isDefault={ ! isSelected }
								isPrimary={ isSelected }
								value={ size.slug }
								onClick={ onChangeSpacingSize }
								aria-pressed={ isSelected }
							>
								{ innerButton }
							</Button>
						</Tooltip>
					);
				} ) }
			</ButtonGroup>
		</BaseControl>
	);
}

export default DimensionControl;
