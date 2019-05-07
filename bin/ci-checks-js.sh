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
  yarn run flow || pFail
  yarn run lint || pFail
fi

if [ "$GUTENBERG_AS_PARENT" = true ] ; then
  TEST_SCRIPT_NAME='test:inside-gb'
else
  TEST_SCRIPT_NAME='test'
fi

if [ "$CHECK_TESTS" = true ] ; then
  # we'll run the tests twich (once for each platform) if the platform env var is not set
  if [[ -z "${TEST_RN_PLATFORM}" ]] ; then
    TEST_RN_PLATFORM=android yarn run ${TEST_SCRIPT_NAME} --maxWorkers=4 || pFail
    TEST_RN_PLATFORM=ios yarn run ${TEST_SCRIPT_NAME} --maxWorkers=4 || pFail
  else
    yarn run ${TEST_SCRIPT_NAME} --maxWorkers=4 || pFail
  fi
fi
