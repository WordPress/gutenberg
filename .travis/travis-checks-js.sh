function pOk() {
  echo "[$(tput setaf 2)OK$(tput sgr0)]"
}

function pFail() {
  echo "[$(tput setaf 1)KO$(tput sgr0)]"
  exit 1
}

npm run flow || pFail
npm run prettier-check || pFail
npm test || pFail
