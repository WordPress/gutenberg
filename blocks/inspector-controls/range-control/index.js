/**
 * WordPress dependencies
 */
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

function RangeControl( { label, value, instanceId, onChange, ...attributes } ) {
	const id = 'inspector-range-control-' + instanceId;

	return (
        <div className="blocks-inspector-control">
            <label className="blocks-inspector-control__label" htmlFor={ id }>{ label }</label>
            <div className="blocks-range-control">
                <input id={ id } type="range" value={ value } onChange={ onChange } { ...attributes } />
    			<span>{ value }</span>
            </div>
        </div>
	);
}

export default withInstanceId( RangeControl );
