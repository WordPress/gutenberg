/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import withClientId from './utils/with-client-id';

const ButtonAppender = compose( [
	withClientId,
] )( function( { clientId } ) {
	return (
		<div className="block-list-appender">
			<Inserter
				rootClientId={ clientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<Button
						className="block-list-appender__toggle"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
					>
						<Icon icon="insert" />
						<span>{ __( 'Add Block' ) }</span>
					</Button>
				) }
				isAppender
			/>
		</div>
	);
} );

export default ButtonAppender;

