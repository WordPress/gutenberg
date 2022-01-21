/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import { space } from '../../ui/utils/space';
import Spinner from '../';
import { Spacer } from '../../spacer';

export default { title: 'Components/Spinner', component: Spinner };

export const _default = () => {
	const cx = useCx();
	const mediumSpinner = cx( css`
		width: ${ space( 20 ) };
		height: ${ space( 20 ) };
	` );
	const largeSpinner = cx( css`
		width: ${ space( 40 ) };
		height: ${ space( 40 ) };
	` );
	return (
		<>
			<Spacer marginBottom={ 6 }>
				<Spinner />
			</Spacer>
			<Spacer marginBottom={ 6 }>
				<Spinner className={ mediumSpinner } />
			</Spacer>
			<Spacer marginBottom={ 6 }>
				<Spinner className={ largeSpinner } />
			</Spacer>
		</>
	);
};
