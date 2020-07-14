/**
 * Internal dependencies
 */
import Card from '../../card';
import CardBody from '../../card/body';
import StyledScopeProvider from '../../styled-scope-provider';

export default {
	title: 'Components/StyledScopeProvider',
	component: StyledScopeProvider,
};

export const _default = () => {
	return (
		<StyledScopeProvider scope="html body">
			<Card>
				<CardBody>
					Styles render with the scope prefix of{ ' ' }
					<code>html body</code>
				</CardBody>
			</Card>
		</StyledScopeProvider>
	);
};
