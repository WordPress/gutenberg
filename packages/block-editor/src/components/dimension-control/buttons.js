/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,

	Tooltip,

} from '@wordpress/components';

import {
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import sizesTable from './sizes';

function DimensionButtons( { controlId, currentSize, onChangeSpacingSize } ) {
	return (
		<Fragment>

			<ButtonGroup
				id={ controlId }
				className="block-editor-dimension-control__buttons"
			>
				{ sizesTable.map( function( size ) {
					const visualName = size.name.substring( 0, 1 );
					const hiddenName = size.name.substring( 1 );
					const isSelected = currentSize === size.slug;

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

		</Fragment>
	);
}

export default DimensionButtons;
