/**
 * WordPress dependencies
 */
import { Notice, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function Columns( { attributes: { displayLayout }, setDisplayLayout } ) {
	return (
		displayLayout?.type === 'flex' && (
			<>
				<RangeControl
					label={ __( 'Columns' ) }
					value={ displayLayout.columns }
					onChange={ ( value ) =>
						setDisplayLayout( { columns: value } )
					}
					min={ 2 }
					max={ Math.max( 6, displayLayout.columns ) }
				/>
				{ displayLayout.columns > 6 && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'This column count exceeds the recommended amount and may cause visual breakage.'
						) }
					</Notice>
				) }
			</>
		)
	);
}
