/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

const ButtonBlockAppender = function( { rootClientId, className } ) {
	return (
		<Inserter
			rootClientId={ rootClientId }
			renderToggle={ ( { onToggle, disabled, isOpen } ) => (
				<Button
					className={ classnames( className, 'block-editor-button-block-appender' ) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ disabled }
				>
					<span className="screen-reader-text">{ __( 'Add Block' ) }</span>
					<Icon icon="insert" />
				</Button>
			) }
			isAppender
		/>
	);
};

export default ButtonBlockAppender;

