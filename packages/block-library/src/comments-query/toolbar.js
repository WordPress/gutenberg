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

export default function CommentsQueryToolbar( {
	attributes: { query },
	setQuery,
} ) {
	return (
		<>
			{ ! query.inherit && (
				<ToolbarGroup>
					<Dropdown
						renderToggle={ ( { onToggle } ) => (
							<ToolbarButton
								icon={ settings }
								label={ __( 'Display settings' ) }
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
											setQuery( {
												perPage: num,
											} );
										} }
										step="1"
										value={ query.perPage }
										isDragEnabled={ false }
									/>
								</BaseControl>
								<BaseControl>
									<NumberControl
										__unstableInputWidth="60px"
										label={ __( 'Offset' ) }
										labelPosition="edge"
										min={ 0 }
										max={ 100 }
										onChange={ ( value ) => {
											const num = parseInt( value, 10 );
											if (
												isNaN( num ) ||
												num < 0 ||
												num > 100
											) {
												return;
											}
											setQuery( { offset: num } );
										} }
										step="1"
										value={ query.offset }
										isDragEnabled={ false }
									/>
								</BaseControl>
								<BaseControl
									help={ __(
										'Limit the pages you want to show, even if the query has more results. To show all pages use 0 (zero).'
									) }
								>
									<NumberControl
										__unstableInputWidth="60px"
										label={ __( 'Max page to show' ) }
										labelPosition="edge"
										min={ 0 }
										onChange={ ( value ) => {
											const num = parseInt( value, 10 );
											if ( isNaN( num ) || num < 0 ) {
												return;
											}
											setQuery( {
												pages: num,
											} );
										} }
										step="1"
										value={ query.pages }
										isDragEnabled={ false }
									/>
								</BaseControl>
							</>
						) }
					/>
				</ToolbarGroup>
			) }
		</>
	);
}
