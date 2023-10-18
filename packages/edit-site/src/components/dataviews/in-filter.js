/**
 * WordPress dependencies
 */
import {
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	SelectControl,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

export default ( { id, fields, view, onChangeView } ) => {
	const field = fields.find( ( f ) => f.id === id );

	return (
		<SelectControl
			value={ view.filters[ id ] }
			prefix={
				<InputControlPrefixWrapper
					as="span"
					className="dataviews__select-control-prefix"
				>
					{ field.header + ':' }
				</InputControlPrefixWrapper>
			}
			options={ field?.elements || [] }
			onChange={ ( value ) => {
				if ( value === '' ) {
					value = undefined;
				}

				onChangeView( ( currentView ) => ( {
					...currentView,
					filters: cleanEmptyObject( {
						...currentView.filters,
						[ id ]: value,
					} ),
				} ) );
			} }
		/>
	);
};
