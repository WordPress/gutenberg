/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	BaseControl,
	__experimentalNumberControl as NumberControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

export default function CommentsQueryLoopToolbar( {
	attributes,
	setAttributes,
} ) {
	const { perPage, order } = attributes;
	return (
		<ToolbarGroup>
			<Dropdown
				renderToggle={ ( { onToggle } ) => (
					<ToolbarButton
						icon={ settings }
						label={ __( 'Discussion Settings' ) }
						onClick={ onToggle }
					/>
				) }
				renderContent={ () => (
					<>
						<BaseControl>
							<NumberControl
								__unstableInputWidth="60px"
								label={ __( 'Items per Page' ) }
								labelPosition="edge"
								min={ 1 }
								max={ 100 }
								onChange={ ( value ) => {
									const num = parseInt( value, 10 );
									if (
										isNaN( num ) ||
										num < 1 ||
										num > 100
									) {
										return;
									}
									setAttributes( {
										...attributes,
										perPage: num,
									} );
								} }
								step="1"
								value={ perPage }
								isDragEnabled={ false }
							/>
						</BaseControl>
						<BaseControl>
							<ToggleControl
								label={ __( 'Newer comments first' ) }
								checked={ order === 'desc' || order === null } // Settings value not available on REST API.
								onChange={ () => {
									setAttributes( {
										...attributes,
										order:
											order === 'desc' || order === null
												? 'asc'
												: 'desc',
									} );
								} }
							/>
						</BaseControl>
					</>
				) }
			/>
		</ToolbarGroup>
	);
}
