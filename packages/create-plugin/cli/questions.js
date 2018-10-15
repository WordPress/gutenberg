/**
 * Inquirer: prompt questions to user for details
 */
const questions = [
	{
		type: 'input',
		name: 'pluginName',
		message: 'Enter plugin name',
		default: 'My Plugin',
	},
	{
		type: 'input',
		name: 'pluginUri',
		message: 'Enter plugin URI',
		default: 'https://wordpress.org/plugins/my-plugin',
	},
	{
		type: 'input',
		name: 'pluginDescription',
		message: 'Enter plugin description',
		default: 'My awesome WordPress plugin',
	},
	{
		type: 'input',
		name: 'pluginVersion',
		message: 'Enter plugin initial version',
		default: '0.0.1',
	},
	{
		type: 'input',
		name: 'pluginAuthor',
		message: 'Enter plugin author name',
		default: 'Bob The Builder',
	},
	{
		type: 'input',
		name: 'pluginLicense',
		message: 'Enter plugin license',
		default: 'GPL3.0',
	},
	{
		type: 'input',
		name: 'blockName',
		message: 'Enter block name',
		default: 'My Block',
	},
	{
		type: 'input',
		name: 'blockDescription',
		message: 'Enter block description',
		default: 'My awesome WordPress block',
	},
	{
		type: 'input',
		name: 'blockIcon',
		message: 'Enter block icon (dashicon/svg)',
		default: 'admin-site',
	},
	{
		type: 'list',
		name: 'blockCategory',
		message: 'Select block category',
		choices: [
			'common',
			'formatting',
			'layout',
			'widgets',
			'embed',
		],
	},
];

module.exports = questions;
