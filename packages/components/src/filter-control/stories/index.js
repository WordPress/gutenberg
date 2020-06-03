/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FilterControl from '../';
import { Flex, FlexBlock } from '../../flex';

export default { title: 'Components/FilterControl', component: FilterControl };

const Example = () => {
	const [ filterStyles, setFilterStyles ] = useState();
	return (
		<Flex align="top">
			<FlexBlock>
				<div style={ filterStyles }>
					<img
						alt="WordPress.org"
						src="https://s.w.org/images/home/screen-themes.png?3"
						style={ { maxWidth: '100%', height: 'auto' } }
					/>
				</div>
			</FlexBlock>
			<FlexBlock>
				<FilterControl
					onChange={ ( nextValue, { styles } ) => {
						setFilterStyles( styles );
					} }
				/>
			</FlexBlock>
		</Flex>
	);
};
export const _default = () => {
	return <Example />;
};
