#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the devnet instance that we started (if we started one and if it's still running).  
  if [ -n "$devnet_pid" ]; then
    if [ "$MODE" = coverage ] && docker inspect -f "{{.State.Running}}" ethnode > /dev/null; then
      docker stop $(docker ps -aq --filter ancestor=0xorg/devnet:latest) > /dev/null
    elif ps -p $devnet_pid > /dev/null; then
        kill -9 $devnet_pid
    fi
  fi
}

devnet_running() {
  nc -z localhost 8545
}

start_devnet() {
  if [ "$MODE" = coverage ]; then
    docker run -it -d --rm -p 8545:8501 -p 8546:8546 --name ethnode 0xorg/devnet:latest /bin/bash > /dev/null &
  else
    ./node_modules/.bin/ganache-cli --networkId 1234 --gasLimit 0xfffffffffff > /dev/null &
  fi

  devnet_pid=$!
}

if devnet_running; then
  echo "Using existing devnet instance"
else
  echo "Starting our own devnet instance"
  start_devnet
fi

if [ "$SOLC_NIGHTLY" = true ]; then
  echo "Downloading solc nightly"
  wget -q https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-nightly.js -O /tmp/soljson.js && find . -name soljson.js -exec cp /tmp/soljson.js {} \;
fi

./node_modules/.bin/truffle version

if [ "$MODE" = coverage ]; then
  if [ ! -d ./build ]; then
    ./node_modules/.bin/truffle compile --all > /dev/null
  fi
  ./node_modules/.bin/truffle test --network coverage "$@"
  ./node_modules/.bin/istanbul report html
  
  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
  ./node_modules/.bin/truffle test "$@"
fi
