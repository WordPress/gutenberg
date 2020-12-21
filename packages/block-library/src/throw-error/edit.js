/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

export default function ThrowErrorEdit() {
	const [ err, setError ] = useState( false );
	return (
		<div>
			{ err &&
				( () => {
					throw new Error( 'Error in block render!' );
				} )() }
			<p>This is where an error will go.</p>
			<p>
				<Button
					isDestructive
					onClick={ () => {
						throw new Error( 'Error in block callback!' );
					} }
				>
					Trigger a non-render error.
				</Button>
			</p>
			<p>
				<Button isDestructive onClick={ () => setError( true ) }>
					Trigger a render error!
				</Button>
			</p>
		</div>
	);
}
