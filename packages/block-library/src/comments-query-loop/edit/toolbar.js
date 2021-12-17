/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	Dropdown,
	ToolbarButton,
	BaseControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

export default function CommentsQueryLoopToolbar( {
	attributes,
	setAttributes,
} ) {
	const { perPage } = attributes;
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
					</>
				) }
			/>
		</ToolbarGroup>
	);
}
