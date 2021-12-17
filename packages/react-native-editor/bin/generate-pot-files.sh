#!/bin/bash
# 
# Extract strings from source code and generates the following POT files:
#   - {PATH}/{PLUGIN_NAME}-blocks.pot             [Contains strings referenced in block.json files]
#   - {PATH}/{PLUGIN_NAME}-source.pot             [Contains strings referenced in all source code files]
#   - {PATH}/{PLUGIN_NAME}-used-android.pot       [Contains strings referenced in Android source-map file]
#   - {PATH}/{PLUGIN_NAME}-used-ios.pot           [Contains strings referenced in iOS source-map file]
#
# Usage:
#   METRO_CONFIG environment variable is recommended to generate the JS bundle without errors.
#   Example: METRO_CONFIG=<METRO_CONFIG_PATH> generate-pot-files.sh ...
#
#   - Generate POT files of Gutenberg to temporary directory:
#   generate-pot-files.sh
#
#   - Generate POT files of Gutenberg to specific path:
#   generate-pot-files.sh --path <PATH>
#
#   - Generate POT files of Gutenberg and other plugins to temporary directory:
#   generate-pot-files.sh domain-plugin-1 <PLUGIN-1_SOURCE_PATH> domain-plugin-2 <PLUGIN-2_SOURCE_PATH>
#
#   - Generate POT files of Gutenberg and other plugins to specific path:
#   generate-pot-files.sh --path <PATH> domain-plugin-1 <PLUGIN-1_SOURCE_PATH> domain-plugin-2 <PLUGIN-2_SOURCE_PATH>
#

# Exit if any command fails
set -e

# Get arguments
while test $# -gt 0; do
  case "$1" in
    -h|--help)
      echo "options:"
      echo "-h, --help                              show brief help"
      echo "-w, --skip-upgrade-wp-cli               skip WP-CLI upgrade"
      echo "-p, --path                              use local path for generating files"
      echo "-d, --debug                             print extra info for debugging"
      exit 0
      ;;
    -w|--skip-upgrade-wp-cli*)
      shift
      SKIP_UPGRADE_WP_CLI='true'
      ;;
    -p|--path*)
      shift
      LOCAL_PATH=$1
      shift
      ;;
    -d|--debug*)
      shift
      DEBUG='true'
      ;;
    *)
      break
      ;;
  esac
done

# Functions
function join_by { local IFS="$1"; shift; echo "$*"; }

function error() {
  echo -e "\033[0;31m$1\033[0m"
  exit 1
}

function setup_wp_cli() {
  local CLI_PATH="$SCRIPT_DIR/wp-cli.phar"

  # Install WP-CLI command
  if [[ ! -f "$CLI_PATH" ]]; then
    echo -e "\n\033[1mInstalling WP-CLI\033[0m"
    curl -Ls https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar -o $CLI_PATH
    chmod +x $CLI_PATH
  fi

  # Upgrade WP-CLI command
  if [[ -z $SKIP_UPGRADE_WP_CLI ]]; then
    echo -e "\n\033[1mUpgrading WP-CLI\033[0m"
    $WP_CLI cli update --nightly --yes
    $WP_CLI --info
  fi
}

function build_gutenberg() {
  echo -e "\n\033[1mBuild Gutenberg packages\033[0m"
  npm run build:gutenberg
}

function generate_bundles() {
  local ENTRY_FILE=$1
  local ANDROID_BUNDLE_OUTPUT=$2
  local ANDROID_SOURCEMAP_OUTPUT=$3
  local IOS_BUNDLE_OUTPUT=$4
  local IOS_SOURCEMAP_OUTPUT=$5

  echo -e "\n\033[1mGenerate Android JS bundle\033[0m"
  npm run rn-bundle -- --platform android --dev false --entry-file "$ENTRY_FILE" --bundle-output "$ANDROID_BUNDLE_OUTPUT" --sourcemap-output "$ANDROID_SOURCEMAP_OUTPUT"
  
  echo -e "\n\033[1mGenerate iOS JS bundle\033[0m"
  npm run rn-bundle -- --platform ios --dev false --entry-file "$ENTRY_FILE" --bundle-output "$IOS_BUNDLE_OUTPUT" --sourcemap-output "$IOS_SOURCEMAP_OUTPUT"
}

function extract_source_from_sourcemap_file() {
  local MAP_FILE=$1
  local TARGET_PATH=$2

  mkdir -p $TARGET_PATH

  echo -e "\n\033[1mExtracting source files from \"$MAP_FILE\" source map file\033[0m"
  node $SCRIPT_DIR/extract-files-from-sourcemap.js $MAP_FILE $TARGET_PATH
}

function generate_pot_files() {
  local OUTPUT_PATH=$1
  local PLUGIN_NAME=$2
  local SOURCE_DIR=$3
  shift 3
  local PLUGINS_TO_SUBTRACT=( $@ )

  # Define subtract pot files
  local SUBTRACT_POT_FILES=()
  for PLUGIN in "$@"; do
    SUBTRACT_POT_FILES+=( "$OUTPUT_PATH/$PLUGIN-used-android.pot" )
    SUBTRACT_POT_FILES+=( "$OUTPUT_PATH/$PLUGIN-used-ios.pot" )
  done
  local SUBTRACT_POT_FILES=$(join_by , ${SUBTRACT_POT_FILES[@]})

  # Define output paths
  local OUTPUT_POT_USED_ANDROID_FILE="$OUTPUT_PATH/$PLUGIN_NAME-used-android.pot"
  local OUTPUT_POT_USED_IOS_FILE="$OUTPUT_PATH/$PLUGIN_NAME-used-ios.pot"
  local OUTPUT_POT_BLOCKS_FILE="$OUTPUT_PATH/$PLUGIN_NAME-blocks.pot"
  local OUTPUT_POT_SOURCE_FILE="$OUTPUT_PATH/$PLUGIN_NAME-source.pot"

  local EXCLUDE_FILES="test/*,e2e-tests/*,bundle/*,build-module/*"

  local DEBUG_PARAM=$([ -z $DEBUG ] && echo "" || echo "--debug")
  local SUBTRACT_PARAM=$([ -z $SUBTRACT_POT_FILES ] && echo "" || echo "--subtract=$SUBTRACT_POT_FILES")
  local DOMAIN_PARAM=$([ "$PLUGIN_NAME" == "gutenberg" ] && echo "--ignore-domain" || echo "--domain=$PLUGIN_NAME")

  local MAKEPOT_COMMAND="$WP_CLI i18n make-pot"

  echo -e "\n\033[1mExtract strings and generate POT files for \"$PLUGIN_NAME\" plugin from \"$SOURCE_DIR\"\033[0m"

  mkdir -p $OUTPUT_PATH

  if [ -n "$SUBTRACT_POT_FILES" ]; then
    echo "--- Strings from ${PLUGINS_TO_SUBTRACT[@]} plugins will be subtracted ---"
  fi
  
  echo -e "\nExtract used strings from Android source-map:"
  $MAKEPOT_COMMAND $ANDROID_EXTRACT_SOURCE_FILES_PATH $DEBUG_PARAM $SUBTRACT_PARAM $DOMAIN_PARAM $OUTPUT_POT_USED_ANDROID_FILE

  echo -e "\nExtract used strings from iOS source-map:"
  $MAKEPOT_COMMAND $IOS_EXTRACT_SOURCE_FILES_PATH $DEBUG_PARAM $SUBTRACT_PARAM $DOMAIN_PARAM $OUTPUT_POT_USED_IOS_FILE

  echo -e "\nExtract strings from block JSON files:"
  $MAKEPOT_COMMAND $SOURCE_DIR $DEBUG_PARAM --exclude="$EXCLUDE_FILES" --skip-js --skip-php --ignore-domain $OUTPUT_POT_BLOCKS_FILE

  echo -e "\nExtract strings from non-native JS code:"
  $MAKEPOT_COMMAND $SOURCE_DIR $DEBUG_PARAM --exclude="$EXCLUDE_FILES" --merge="$OUTPUT_POT_BLOCKS_FILE" $DOMAIN_PARAM $OUTPUT_POT_SOURCE_FILE
}

# Get parameters
PLUGINS=( "$@" )

# Validate parameters
if [[ $((${#PLUGINS[@]}%2)) -ne 0 ]]; then
  error "Plugin arguments must be be even."
fi

for (( index=0; index<${#PLUGINS[@]}; index+=2 )); do
  PLUGIN_FOLDER=${PLUGINS[index+1]}

  if [[ ! -d $PLUGIN_FOLDER ]]; then
    NOT_FOUND_PLUGIN_FOLDERS+=( $PLUGIN_FOLDER )
    echo -e "\033[0;31mPlugin folder \"$PLUGIN_FOLDER\" doesn't exist.\033[0m"
  fi
done
if [[ -n $NOT_FOUND_PLUGIN_FOLDERS ]]; then
  exit 1
fi

# Define constants
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
GUTENBERG_SOURCE_CODE_DIR="$SCRIPT_DIR/../.."
WP_CLI="php -d memory_limit=4G $SCRIPT_DIR/wp-cli.phar"

# Set target path
if [[ -n $LOCAL_PATH ]]; then
  TARGET_PATH=$LOCAL_PATH
else
  TARGET_PATH=$(mktemp -d)
fi

# Set JS bundle directory
BUNDLE_DIR="$TARGET_PATH/bundle"
mkdir -p $BUNDLE_DIR

# Set source files extraction directory
EXTRACT_SOURCE_FILES_DIR="$TARGET_PATH/source-files"
mkdir -p $EXTRACT_SOURCE_FILES_DIR

# Set POT files directory
POT_FILES_DIR="$TARGET_PATH"

# Define JS bundle paths
BUNDLE_ENTRY_FILE="./index.js"

ANDROID_BUNDLE_DIR="$BUNDLE_DIR/android"
ANDROID_BUNDLE_PATH="$ANDROID_BUNDLE_DIR/App.text.js"
ANDROID_SOURCEMAP_PATH="$ANDROID_BUNDLE_DIR/App.text.js.map"

IOS_BUNDLE_DIR="$BUNDLE_DIR/ios"
IOS_BUNDLE_PATH="$IOS_BUNDLE_DIR/App.js"
IOS_SOURCEMAP_PATH="$IOS_BUNDLE_DIR/App.js.map"

# Define source files extraction paths
ANDROID_EXTRACT_SOURCE_FILES_PATH="$EXTRACT_SOURCE_FILES_DIR/android"
IOS_EXTRACT_SOURCE_FILES_PATH="$EXTRACT_SOURCE_FILES_DIR/ios"

echo -e "\n\033[1m== Generating POT files in \"$TARGET_PATH\" ==\033[0m"

# Setup WP cli
setup_wp_cli

# Generate JS bundle
build_gutenberg
mkdir -p $ANDROID_BUNDLE_DIR
mkdir -p $IOS_BUNDLE_DIR
generate_bundles $BUNDLE_ENTRY_FILE $ANDROID_BUNDLE_PATH $ANDROID_SOURCEMAP_PATH $IOS_BUNDLE_PATH $IOS_SOURCEMAP_PATH

# Extract source from sourcemap files
extract_source_from_sourcemap_file $ANDROID_SOURCEMAP_PATH $ANDROID_EXTRACT_SOURCE_FILES_PATH
extract_source_from_sourcemap_file $IOS_SOURCEMAP_PATH $IOS_EXTRACT_SOURCE_FILES_PATH

# Generate POT files for specified plugins
for (( index=0; index<${#PLUGINS[@]}; index+=2 )); do
  PLUGIN_NAME=${PLUGINS[index]}
  PLUGIN_FOLDER=${PLUGINS[index+1]}

  PLUGINS_TO_EXTRACT_FROM_GUTENGERG+=( $PLUGIN_NAME )

  generate_pot_files $POT_FILES_DIR $PLUGIN_NAME $PLUGIN_FOLDER
done

# Generate POT files for Gutenberg
generate_pot_files $POT_FILES_DIR "gutenberg" $GUTENBERG_SOURCE_CODE_DIR "${PLUGINS_TO_EXTRACT_FROM_GUTENGERG[@]}"
