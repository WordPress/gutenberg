/**
 * External dependencies
 */
import styled from 'styled-components';

const Main = styled.div`
	margin-top: var( --navHeight );
`;

const Layout = styled.div``;

const Container = styled.div`
	max-width: 960px;
	margin: 0 auto;
	width: 100%;
`;

const Content = styled.div`
	padding: 40px 20px 20vh;
	margin: auto;
	max-width: 800px;

	${ ( { isWide } ) =>
		isWide &&
		`
	max-width: 1020px;
	` }
`;

const BodyWithSidebar = styled.div`
	margin-left: 280px;
`;

Layout.Main = Main;
Layout.Container = Container;
Layout.Content = Content;
Layout.BodyWithSidebar = BodyWithSidebar;

export default Layout;
