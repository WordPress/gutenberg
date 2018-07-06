function pOk() {
  echo "[$(tput setaf 2)OK$(tput sgr0)]"
}

function pFail() {
  echo "[$(tput setaf 1)KO$(tput sgr0)]"
  exit 1
}

# if both env variables are missing then force them to `true`. Otherwise will respect the combination passed externally
if [[ -z "${CHECK_CORRECTNESS}" ]] && [[ -z "${CHECK_TESTS}" ]] ; then
  CHECK_CORRECTNESS=true
  CHECK_TESTS=true
fi

if [ "$CHECK_CORRECTNESS" = true ] ; then
  npm run flow || pFail
  npm run lint || pFail
fi

if [ "$CHECK_TESTS" = true ] ; then
  # build the Gutenberg packages
  pushd gutenberg
  npm i || pFail
  popd

  # we'll run the tests twich (once for each platform) if the platform env var is not set
  if [[ -z "${TEST_RN_PLATFORM}" ]] ; then
    TEST_RN_PLATFORM=android npm test || pFail
    TEST_RN_PLATFORM=ios npm test || pFail
  else
    npm test || pFail
  fi
fi
