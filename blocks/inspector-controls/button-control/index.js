/**
 * WordPress dependencies
 */
import { Button, withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

function ButtonControl( { instanceId, label, value, help, ...props } ) {
	const id = 'inspector-button-control-' + instanceId;
	return (
		<BaseControl id={ id } label={ label } help={ help } className="blocks-button-control">
			<Button { ...props } id={ id } isLarge className={ 'blocks-button-control__button' }>
				{ value }
			</Button>
		</BaseControl>
	);
}

export default withInstanceId( ButtonControl );
