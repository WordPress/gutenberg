/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { link } from '@wordpress/icons';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from '../cell';
import LinkPickerResults from './link-picker-results';

function LinkCell( { value, onChangeValue, onSubmit, onLinkPicked } ) {
	return (
		<>
			<Cell
				icon={ link }
				label={ __( 'URL' ) }
				value={ value }
				placeholder={ __( 'Add URL' ) }
				autoCapitalize="none"
				autoCorrect={ false }
				keyboardType="url"
				onChangeValue={ onChangeValue }
				onSubmit={ onSubmit }
				/* eslint-disable-next-line jsx-a11y/no-autofocus */
				autoFocus={ Platform.OS === 'ios' }
			/>
			{ !! value && (
				<LinkPickerResults
					query={ value }
					onLinkPicked={ onLinkPicked }
				/>
			) }
		</>
	);
}

export default withPreferredColorScheme( LinkCell );
