/**
 * External dependencies
 */
import type { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import Icon from '../';
import check from '../../library/check';
import * as icons from '../../';

const meta = {
	component: Icon,
	title: 'Icons/Icon',
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
};
export default meta;

export const Default = (): ReactElement => {
	return (
		<>
			<div>
				<h2>Dashicons (corrected viewport)</h2>

				<Icon icon={ check } />
				<Icon icon={ check } size={ 36 } />
				<Icon icon={ check } size={ 48 } />
			</div>
			<div>
				<h2>Material and Other</h2>

				<Icon icon={ icons.paragraph } />
				<Icon icon={ icons.paragraph } size={ 36 } />
				<Icon icon={ icons.paragraph } size={ 48 } />
			</div>
		</>
	);
};
