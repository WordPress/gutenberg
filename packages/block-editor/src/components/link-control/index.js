/**
 * WordPress dependencies
 */
import {
	IconButton,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

import {
	useCallback,
	useState,
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	URLPopover,
} from '../';

import { withInstanceId } from '@wordpress/compose';

function LinkControl( { instanceId, defaultOpen = false } ) {
	// State
	const [ isOpen, setIsOpen ] = useState( defaultOpen );
	const [ inputValue, setInputValue ] = useState( '' );

	// Effects
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	// Handlers
	const onInputChange = ( event ) => {
		setInputValue( event.target.value );
	};

	const inputId = `link-control-search-input-${ instanceId }`;

	return (
		<Fragment>
			<IconButton
				icon="insert"
				className="components-toolbar__control"
				label={ __( 'Insert link' ) }
				onClick={ openLinkUI }
			/>

			{ isOpen && (

				<URLPopover>
					<form onSubmit={ onInputChange }>
						<label htmlFor={ inputId }>{ __( 'Search or input url' ) }</label>
						<input id={ inputId } className="link-control__search-input" type="url" value={ inputValue } onChange={ onInputChange } />
					</form>
				</URLPopover>

			) }
		</Fragment>
	);
}

export default withInstanceId( LinkControl );
