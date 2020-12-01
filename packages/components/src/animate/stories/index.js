/**
 * External dependencies
 */
import { button, radios } from '@storybook/addon-knobs';
import { useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import { getAnimateClassName } from '../';
import Notice from '../../notice';

export default { title: 'Components/getAnimateClassName' };

export const _default = () => {
	const typeToOrigin = useMemo(
		() => ( {
			appear: [
				[
					'top',
					'top left',
					'top right',
					'middle',
					'middle left',
					'middle right',
					'bottom',
					'bottom left',
					'bottom right',
				],
				'top left',
			],
			'slide-in': [ [ 'left', 'right' ], 'left' ],
			loading: [ [], undefined ],
		} ),
		[]
	);
	const [ k, setK ] = useState( Number.MIN_SAFE_INTEGER );
	button( 'Replay animation', () => setK( ( prevK ) => prevK + 1 ) );
	const type = radios(
		'Type',
		[ 'appear', 'slide-in', 'loading' ],
		'appear'
	);
	const origin = radios( 'Origin', ...typeToOrigin[ type ] );

	return (
		<Notice
			className={ getAnimateClassName( { type, origin } ) }
			status="success"
			key={ k }
		>
			<p>
				<code>{ type }</code> animation.
			</p>
			{ origin && (
				<p>
					Origin: <code>{ origin }</code>.
				</p>
			) }
		</Notice>
	);
};
