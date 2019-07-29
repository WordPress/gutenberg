/**
 * External dependencies
 */
import { isArray, isEmpty } from 'lodash';

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

export function DimensionButtons( { id, sizes, currentSize, onChangeSpacingSize } ) {
	if ( ! id ) {
		return null;
	}

	if ( ! sizes || ! isArray( sizes ) || isEmpty( sizes ) ) {
		return null;
	}

	return (
		<Fragment>

			<ButtonGroup
				id={ `block-editor-dimension-control-buttons-${ id }` }
				className="block-editor-dimension-control__buttons"
			>
				{ sizes.map( function( size ) {
					const isSelected = currentSize === size.slug;

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
								<abbr title={ size.name }>
									{ size.abbr }
								</abbr>
							</Button>
						</Tooltip>
					);
				} ) }
			</ButtonGroup>

		</Fragment>
	);
}

export default DimensionButtons;
