/**
 * External dependencies
 */
import { button, radios } from '@storybook/addon-knobs';
import { useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import Animate from '../';
import Notice from '../../notice';

export default { title: 'Components/Animate', component: Animate };

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
		<Animate type={ type } origin={ origin } key={ k }>
			{ ( { className } ) => (
				<Notice className={ className } status="success">
					<p>
						<code>{ type }</code> animation.
					</p>
					{ origin && (
						<p>
							Origin: <code>{ origin }</code>.
						</p>
					) }
				</Notice>
			) }
		</Animate>
	);
};
