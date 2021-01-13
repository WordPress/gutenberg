// This is so that when CI calls npm through Gradle, it won't fail because of
// lack of memory.
//
// See:
// - Where this this suggested: https://stackoverflow.com/a/56027775/809944
// - Example of failing build: https://app.circleci.com/pipelines/github/wordpress-mobile/gutenberg-mobile/9720/workflows/3688f362-78bf-4804-ad60-88762a30f6d3/jobs/51519
module.exports = {
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false,
			},
		}),
	},
	maxWorkers: 1
}
