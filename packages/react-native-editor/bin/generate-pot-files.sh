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
set -euo pipefail

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
  local cli_path="$SCRIPT_DIR/wp-cli.phar"

  # Install WP-CLI command
  if [[ ! -f "$cli_path" ]]; then
    echo -e "\n\033[1mInstalling WP-CLI\033[0m"
    curl -Ls https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar -o $cli_path
    chmod +x $cli_path
  fi

  # Upgrade WP-CLI command
  if [[ -z "${SKIP_UPGRADE_WP_CLI:-}" ]]; then
    echo -e "\n\033[1mUpgrading WP-CLI\033[0m"
    $WP_CLI cli update --nightly --yes
    $WP_CLI --info
  fi
}

function generate_bundles() {
  local entry_file=$1
  local android_bundle_output=$2
  local android_sourcemap_output=$3
  local ios_bundle_output=$4
  local ios_sourcemap_output=$5

  echo -e "\n\033[1mGenerate Android JS bundle\033[0m"
  $BUNDLE_CLI --platform android --dev false --entry-file "$entry_file" --bundle-output "$android_bundle_output" --sourcemap-output "$android_sourcemap_output"
  
  echo -e "\n\033[1mGenerate iOS JS bundle\033[0m"
  $BUNDLE_CLI --platform ios --dev false --entry-file "$entry_file" --bundle-output "$ios_bundle_output" --sourcemap-output "$ios_sourcemap_output"
}

function extract_source_from_sourcemap_file() {
  local map_file=$1
  local target_path=$2

  mkdir -p $target_path

  echo -e "\n\033[1mExtracting source files from \"$map_file\" source map file\033[0m"
  node $SCRIPT_DIR/extract-files-from-sourcemap.js $map_file $target_path
}

function make_pot () {
  local source=$1
  local arguments=$2
  local makepot_command="$WP_CLI i18n make-pot"

  # In order to detect parse errors, we need to use the "--debug" option, otherwise "make-pot" command doesn't output errors.
  local full_command="$makepot_command $source --debug $arguments"
  if [[ -z ${DEBUG:-} ]]; then
    # When DEBUG flag is not enabled, we ignore extra debug information except important warnings.
    local ignore_pattern="Parsing file\|Debug (commands)\|Debug (bootstrap)\|Debug (hooks)"
    $full_command 2> >(grep -v "$ignore_pattern" >&2)
  else
    $full_command
  fi
}

function generate_pot_files() {
  local output_path=$1
  local plugin_name=$2
  local source_dir=$3
  shift 3
  local plugins_to_subtract=( $@ )

  # Define subtract pot files
  local subtract_pot_files=()
  for PLUGIN in "$@"; do
    subtract_pot_files+=( "$output_path/$PLUGIN-used-android.pot" )
    subtract_pot_files+=( "$output_path/$PLUGIN-used-ios.pot" )
  done
  local subtract_pot_files=$(join_by , ${subtract_pot_files[@]+"${subtract_pot_files[@]}"})

  # Define output paths
  local output_pot_used_android_file="$output_path/$plugin_name-used-android.pot"
  local output_pot_used_ios_file="$output_path/$plugin_name-used-ios.pot"
  local output_pot_blocks_file="$output_path/$plugin_name-blocks.pot"
  local output_pot_source_file="$output_path/$plugin_name-source.pot"

  local exclude_files="test/*,e2e-tests/*,bundle/*,build-module/*,*.map,bin/*,local-test/*"
  local subtract_param=$([ -z $subtract_pot_files ] && echo "" || echo "--subtract=$subtract_pot_files")
  local domain_param=$([ "$plugin_name" == "gutenberg" ] && echo "--ignore-domain" || echo "--domain=$plugin_name")

  echo -e "\n\033[1mExtract strings and generate POT files for \"$plugin_name\" plugin from \"$source_dir\"\033[0m"

  mkdir -p $output_path

  if [ -n "$subtract_pot_files" ]; then
    echo "-- Strings from ${plugins_to_subtract[@]} plugins will be subtracted --"
  fi
  
  echo -e "\nExtract used strings from Android source-map:"
  make_pot "$ANDROID_EXTRACT_SOURCE_FILES_PATH" "$subtract_param $domain_param $output_pot_used_android_file"

  echo -e "\nExtract used strings from iOS source-map:"
  make_pot "$IOS_EXTRACT_SOURCE_FILES_PATH" "$subtract_param $domain_param $output_pot_used_ios_file"

  echo -e "\nExtract strings from block JSON files:"
  make_pot "$source_dir" "--exclude="$exclude_files" --skip-js --skip-php --ignore-domain $output_pot_blocks_file"

  echo -e "\nExtract strings from source:"
  make_pot "$source_dir" "--exclude="$exclude_files" --merge="$output_pot_blocks_file" $domain_param $output_pot_source_file"
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
if [[ -n "${NOT_FOUND_PLUGIN_FOLDERS:-}" ]]; then
  exit 1
fi

# Define constants
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
GUTENBERG_SOURCE_CODE_DIR="$SCRIPT_DIR/../../.."
WP_CLI="php -d memory_limit=4G $SCRIPT_DIR/wp-cli.phar"
BUNDLE_CLI="$GUTENBERG_SOURCE_CODE_DIR/node_modules/.bin/react-native bundle --config ${METRO_CONFIG:-metro.config.js}"

# Set target path
if [[ -n ${LOCAL_PATH:-} ]]; then
  TARGET_PATH=$LOCAL_PATH
else
  TARGET_PATH=$(mktemp -d)
fi

# Set JS bundle directory
BUNDLE_DIR="$TARGET_PATH/bundle"
mkdir -p $BUNDLE_DIR
trap '{ rm -rf -- "$BUNDLE_DIR"; }' EXIT

# Set source files extraction directory
EXTRACT_SOURCE_FILES_DIR="$TARGET_PATH/source-files"
mkdir -p $EXTRACT_SOURCE_FILES_DIR
trap '{ rm -rf -- "$EXTRACT_SOURCE_FILES_DIR"; }' EXIT

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

  PLUGINS_TO_EXTRACT_FROM_GUTENBERG+=( $PLUGIN_NAME )

  generate_pot_files $POT_FILES_DIR $PLUGIN_NAME $PLUGIN_FOLDER
done

# Generate POT files for Gutenberg
generate_pot_files $POT_FILES_DIR "gutenberg" "$GUTENBERG_SOURCE_CODE_DIR" "${PLUGINS_TO_EXTRACT_FROM_GUTENBERG[@]+"${PLUGINS_TO_EXTRACT_FROM_GUTENBERG[@]}"}"