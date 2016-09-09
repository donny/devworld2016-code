# OpenWhisk

# Preparation
alias hcat='highlight -O ansi'
tmux new-session -s shared
tmux attach-session -t shared
Create 4 Terminal Windows (2 as backups)

# Install the `wsk` CLI:
pip install --upgrade https://new-console.ng.bluemix.net/openwhisk/cli/download

# First action
hcat greetSomeone.swift
# Create a new action
wsk action create greetSomeone greetSomeone.swift
wsk action invoke greetSomeone --param name Jones --blocking
wsk action invoke greetSomeone --param name Jones --blocking --result
# If you don't need to see the result, it's async
wsk action invoke greetSomeone --param name Jones
wsk activation result 00

# Sequence
hcat sort.swift
wsk action create sort sort.swift
hcat uppercase.swift
wsk action create uppercase uppercase.swift
wsk action create uppercaseSort --sequence uppercase,sort
wsk action invoke uppercaseSort --blocking --result --param payload '["a", "c", "b"]'

# The parameter name `payload` is the same for input as well as for output. This simplifies action composition.

wsk action list
wsk action delete

# Perform HTTP call
wsk -v action invoke greetSomeone --param name Jones --blocking --result

# Get auth
wsk property get --auth
# All OpenWhisk APIs are protected with HTTP Basic authentication.
curl -X POST -H "Content-Type: application/json" --data '{"name": "Jones"}' -u 5520-4af7-8237-039bb17d0767:000 https://openwhisk.ng.bluemix.net/api/v1/namespaces/worqbench_dev/actions/greetSomeone?blocking=true

# At the moment, OpenWhisk supports only one key per account. Be aware that your key would need to be embedded in client-side code making it visible to the public.

# iOS
mkdir iOS ; cd iOS
wsk sdk install iOS
pod install
