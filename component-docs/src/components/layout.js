/**
 * External dependencies
 */
import styled from '@emotion/styled';

const Sidebar = styled( 'div' )`
	border-right: 1px solid #eee;
	bottom: 0;
	left: 0;
	width: 280px;
	position: fixed;
	top: 0;
`;

const Main = styled( 'div' )`
	margin-left: 280px;
`;

const Content = styled( 'div' )`
	padding: 40px 20px 20vh;
	margin: auto;
	max-width: 800px;
`;

const Layout = styled( 'div' )``;

const Container = styled( 'div' )`
	max-width: 960px;
	margin: 0 auto;
`;

Layout.Main = Main;
Layout.Container = Container;
Layout.Sidebar = Sidebar;
Layout.Content = Content;

export default Layout;
