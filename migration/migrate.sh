# HOW TO RUN THIS SCRIPT
#
# 1. Install grit (https://docs.grit.io/cli/quickstart#installation):
#    $ npm install --location=global @getgrit/cli
#
# 2. Run this script from the root of the project (<- IMPORTANT):
#    $ ./migration/migrate.sh

function apply() {
	grit apply --force --output none "migration/patterns/$1.grit" packages/components
}

apply await_render_calls
apply replace_ariakit_test_import
git checkout '*.native.*'
npm run lint:js:fix -- packages/components
