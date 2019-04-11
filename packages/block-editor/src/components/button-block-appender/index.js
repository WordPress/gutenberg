/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

const ButtonBlockAppender = function( { rootClientId, className = '' } ) {
	return (
		<Inserter
			rootClientId={ rootClientId }
			renderToggle={ ( { onToggle, disabled, isOpen } ) => (
				<Button
					className={ `${ className } button-block-appender` }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ disabled }
				>
					<span>{ __( 'Add Block' ) }</span>
					<Icon icon="insert" />
				</Button>
			) }
			isAppender
		/>
	);
};

export default ButtonBlockAppender;

