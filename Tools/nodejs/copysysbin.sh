if [[ "$OSTYPE" == "linux-gnu" ]]; then
	cp "$( dirname "${BASH_SOURCE[0]}" )"/node-linux64 "$( dirname "${BASH_SOURCE[0]}" )"/node
elif [[ "$OSTYPE" == "darwin"* ]]; then
	cp "$( dirname "${BASH_SOURCE[0]}" )"/node-osx "$( dirname "${BASH_SOURCE[0]}" )"/node
fi

